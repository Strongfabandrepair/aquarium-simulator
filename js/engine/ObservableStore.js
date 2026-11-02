// =========================================
// OBSERVABLE STATE STORE (DEEP PROXY PATTERN)
// =========================================

export class ObservableStore {
    constructor(initialState) {
        this._listeners = new Map(); // path -> Set of callbacks
        this._pendingNotifications = new Set(); // queued paths for batching
        this._batchPromise = null;

        // Initialize state reference
        this._state = initialState;
        this.state = this._deepProxy(this._state, []);
    }

    /**
     * Subscribe a callback to changes at a specific path (e.g. "water.temperature" or "budget")
     * @param {string} path The dotted path to watch. Use "*" to watch all changes.
     * @param {function} callback Called with (newValue, oldValue)
     * @returns {function} Unsubscribe function
     */
    subscribe(path, callback) {
        if (!this._listeners.has(path)) {
            this._listeners.set(path, new Set());
        }
        this._listeners.get(path).add(callback);
        return () => this._listeners.get(path).delete(callback);
    }

    /**
     * Set a value at a specific path
     * @param {string} path Dotted path, e.g. "water.temperature"
     * @param {any} value New value
     */
    set(path, value) {
        const parts = path.split('.');
        const lastKey = parts.pop();

        // Traverse to the parent object
        let current = this.state;
        for (const part of parts) {
            if (current[part] === undefined) {
                current[part] = {};
            }
            current = current[part];
        }

        current[lastKey] = value;
    }

    /**
     * Get a value from a specific path
     * @param {string} path Dotted path, e.g. "water.temperature"
     * @returns {any} Value or undefined
     */
    get(path) {
        return path.split('.').reduce((obj, key) => obj?.[key], this.state);
    }

    /**
     * Load a new state object into the store in-place, keeping existing proxies & subscribers
     * @param {object} newState The new state object to load
     */
    load(newState) {
        if (!newState || typeof newState !== 'object') return;

        // Clean up old keys on the raw target
        const rawTarget = this._state;
        for (const key in rawTarget) {
            if (Object.prototype.hasOwnProperty.call(rawTarget, key)) {
                delete rawTarget[key];
            }
        }

        // Assign new keys onto the raw target
        for (const key in newState) {
            if (Object.prototype.hasOwnProperty.call(newState, key)) {
                rawTarget[key] = this._deepProxy(newState[key], [key]);
            }
        }

        // Notify subscribers of a global load change
        this._queueNotification('*');
    }

    /**
     * Deeply wraps an object or array in a Proxy to intercept mutations
     * @private
     */
    _deepProxy(obj, pathSegments) {
        if (obj === null || typeof obj !== 'object' || obj instanceof Date) {
            return obj;
        }

        // To prevent double proxies
        if (obj.__isProxy) {
            return obj;
        }

        const self = this;

        // Wrap child properties first
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                obj[key] = this._deepProxy(obj[key], [...pathSegments, key]);
            }
        }

        return new Proxy(obj, {
            get(target, prop, receiver) {
                if (prop === '__isProxy') return true;
                if (prop === '__rawTarget') return target;
                return Reflect.get(target, prop, receiver);
            },

            set(target, prop, value, _receiver) {
                const currentPath = [...pathSegments, String(prop)].join('.');
                const oldValue = target[prop];

                // If setting an object, wrap it in a proxy too
                const wrappedValue = self._deepProxy(value, [
                    ...pathSegments,
                    String(prop)
                ]);
                const success = Reflect.set(target, prop, wrappedValue);

                if (success && oldValue !== value) {
                    // Queue notification for batching
                    self._queueNotification(currentPath);
                }

                return success;
            },

            deleteProperty(target, prop) {
                const currentPath = [...pathSegments, String(prop)].join('.');
                const success = Reflect.deleteProperty(target, prop);
                if (success) {
                    self._queueNotification(currentPath);
                }
                return success;
            }
        });
    }

    /**
     * Queues a path notification to be fired at the end of the current microtask
     * @private
     */
    _queueNotification(path) {
        this._pendingNotifications.add(path);

        if (!this._batchPromise) {
            this._batchPromise = Promise.resolve().then(() => {
                this._flushNotifications();
            });
        }
    }

    /**
     * Flushes and fires all queued notifications
     * @private
     */
    _flushNotifications() {
        const pathsToNotify = Array.from(this._pendingNotifications);
        this._pendingNotifications.clear();
        this._batchPromise = null;

        const uniquePaths = new Set();
        for (const path of pathsToNotify) {
            uniquePaths.add(path);
            uniquePaths.add('*');
            const parts = path.split('.');
            while (parts.length > 1) {
                parts.pop();
                uniquePaths.add(parts.join('.'));
            }
        }

        for (const path of uniquePaths) {
            this._triggerListeners(path);
        }
    }

    /**
     * Triggers listener callbacks for a path
     * @private
     */
    _triggerListeners(path) {
        const listeners = this._listeners.get(path);
        if (listeners) {
            const val = path === '*' ? this.state : this.get(path);
            listeners.forEach((callback) => {
                try {
                    callback(val);
                } catch (err) {
                    console.error(`Error in observer for path "${path}":`, err);
                }
            });
        }
    }
}
