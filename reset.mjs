/**
 * Restores wiki.md to its pristine state.
 *
 * The demos each reset on startup, so this is only here for when you have been
 * poking at wiki.md by hand and want a clean slate.
 */

import { resetWiki } from './fixture.mjs';

resetWiki();
console.log('✓ wiki.md reset to its original state.\n');
