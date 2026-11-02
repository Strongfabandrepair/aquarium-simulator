# ReefSim review — November 2, 2026

Reviewed README.md, CLAUDE.md, SESSION.md, PERFORMANCE_PLAN.md, simulation orchestration, persistence, procedural graphics, and dashboard interaction.

## Implemented

- Dashboard updates follow batched state changes; animation continues independently and skips hidden pages.
- Water uses a subdivided surface with vertical waves and animated specular normals. Sand caustics drift over time. Glass no longer writes depth over livestock. Output uses sRGB and ACES tone mapping.
- Pixel ratio is capped at 2; container resizing uses ResizeObserver instead of per-frame layout reads.
- Fish interpolation, sinking, and bubbles use elapsed time. Deleted livestock and rebuilt environments release their geometry/material resources, preserving cached textures. Membership checks are linear.
- Quiz buttons take precedence over their parent cards. Lessons display on explicit topic clicks and advance knowledge so quizzes unlock. Repeated answer clicks cannot skip questions or score twice.
- Snapshot loading preserves defaults for partially saved nested objects. Resuming or starting restarts the simulation timer with the loaded speed.
- Water changes check the salt needed for the selected tank volume.
- Unit and browser runners are separated; browser imports use the installed Playwright package. Build and browser scripts are documented and esbuild is an explicit dependency.

## Scope and follow-up

The simulation remains an educational approximation. Tank sizes currently share a common display coordinate system. A future graphics pass could add species-specific LOD and instanced coral polyps. No frame-rate speedup percentage is claimed without controlled hardware benchmarks.

The original checkout contains tracked dependency trees and machine-specific settings. The new GitHub repository is a clean source snapshot excluding those files, obsolete monolithic prototypes, and generated test reports. Original history stays in the existing checkout.

The optional OmniRoute development dependency brings existing transitive npm audit findings; changing that separate tool's dependency tree was outside this graphics and simulator correction pass.
