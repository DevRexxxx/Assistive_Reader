import test from 'node:test';
import assert from 'node:assert/strict';
import {
  WIZARD_SAMPLE_PASSAGES,
  buildWizardPreviewProfile,
  classifyWcagContrast,
  computeWcagContrastRatio,
  createInitialWizardState,
  finalizeWizardProfile,
  getCurrentWizardStep,
  getWizardPreviewMetrics,
  getWizardSteps,
  goToWizardStep,
  nextWizardStep,
  prevWizardStep,
  resetWizardState,
  selectWizardOption,
  setWizardProfileName,
  setWizardSampleText,
  validateProfile,
} from '../index';

test('wizard state initializes with 4 steps and navigates safely within bounds', () => {
  let state = createInitialWizardState();
  const steps = getWizardSteps(state);
  assert.equal(steps.length, 4);
  assert.equal(getCurrentWizardStep(state).id, 'font');

  // Cannot go before step 0
  state = prevWizardStep(state);
  assert.equal(state.currentStepIndex, 0);

  // Advance through steps marks completion
  state = nextWizardStep(state);
  assert.equal(state.currentStepIndex, 1);
  assert.equal(state.stepsCompleted.font, true);
  assert.equal(getCurrentWizardStep(state).id, 'spacing');

  state = nextWizardStep(state);
  assert.equal(getCurrentWizardStep(state).id, 'color');

  state = nextWizardStep(state);
  assert.equal(getCurrentWizardStep(state).id, 'review');

  // Clamp beyond last step
  state = nextWizardStep(state);
  assert.equal(state.currentStepIndex, 3);

  // Direct jump and out-of-bounds clamping
  state = goToWizardStep(state, -5);
  assert.equal(state.currentStepIndex, 0);
  state = goToWizardStep(state, 99);
  assert.equal(state.currentStepIndex, 3);
});

test('wizard option selection updates font, spacing, fine-tune overrides, and surface defaults', () => {
  let state = createInitialWizardState();

  state = selectWizardOption(state, 'fontPreference', 'opendyslexic');
  state = selectWizardOption(state, 'spacingPreference', 'airy');
  state = selectWizardOption(state, 'fontScaleOverride', 1.4);
  state = selectWizardOption(state, 'lineHeightOverride', 2.4);
  state = selectWizardOption(state, 'letterSpacingOverride', 0.15);

  let metrics = getWizardPreviewMetrics(state);
  assert.equal(metrics.fontFamily, 'opendyslexic');
  assert.equal(metrics.fontScale, 1.4);
  assert.equal(metrics.fontSizePx, 25);
  assert.equal(metrics.lineHeight, 2.4);
  assert.equal(metrics.letterSpacingEm, 0.15);

  // Switching spacing preset clears manual overrides so preset takes effect cleanly
  state = selectWizardOption(state, 'spacingPreference', 'compact');
  metrics = getWizardPreviewMetrics(state);
  assert.equal(metrics.fontScale, 0.95);
  assert.equal(metrics.lineHeight, 1.5);
  assert.equal(metrics.letterSpacingEm, 0);

  // Switching surface syncs recommended overlay and motion setting, while allowing overlay override
  state = selectWizardOption(state, 'surfacePreference', 'cream');
  metrics = getWizardPreviewMetrics(state);
  assert.equal(metrics.overlay, 'yellow');
  assert.ok(metrics.overlayRgba);
  assert.equal(metrics.disableAnimations, false);

  state = selectWizardOption(state, 'overlayPreference', 'blue');
  assert.equal(getWizardPreviewMetrics(state).overlay, 'blue');

  state = selectWizardOption(state, 'surfacePreference', 'calm-dark');
  metrics = getWizardPreviewMetrics(state);
  assert.equal(metrics.background, '#111827');
  assert.equal(metrics.disableAnimations, true);
});

test('wizard clamps out-of-range fine-tune sliders and computes WCAG contrast accurately', () => {
  let state = createInitialWizardState();
  state = selectWizardOption(state, 'fontScaleOverride', 99);
  state = selectWizardOption(state, 'lineHeightOverride', 0.2);
  state = selectWizardOption(state, 'letterSpacingOverride', -2);

  const metrics = getWizardPreviewMetrics(state);
  assert.equal(metrics.fontScale, 2.0);
  assert.equal(metrics.lineHeight, 1.2);
  assert.equal(metrics.letterSpacingEm, 0);

  // Contrast calculations across surfaces
  assert.ok(computeWcagContrastRatio('#0f172a', '#ffffff') >= 15);
  assert.equal(classifyWcagContrast(15), 'AAA');
  assert.equal(classifyWcagContrast(5.1), 'AA');
  assert.equal(classifyWcagContrast(3.0), 'Below AA');

  for (const surface of ['crisp', 'cream', 'soft-mint', 'calm-dark'] as const) {
    const s = selectWizardOption(createInitialWizardState(), 'surfacePreference', surface);
    const m = getWizardPreviewMetrics(s);
    assert.ok(m.contrastRatio >= 7, `Expected AAA contrast >= 7 for ${surface}, got ${m.contrastRatio}`);
    assert.equal(m.wcagContrastLevel, 'AAA');
  }
});

test('wizard finalize builds a schema-valid custom Profile and handles reset', () => {
  let state = createInitialWizardState();
  state = selectWizardOption(state, 'fontPreference', 'serif');
  state = selectWizardOption(state, 'spacingPreference', 'balanced');
  state = selectWizardOption(state, 'surfacePreference', 'soft-mint');
  state = selectWizardOption(state, 'lineWidthPreference', 'narrow');
  state = setWizardProfileName(state, '  Evening Mint Study  ');
  state = setWizardSampleText(state, WIZARD_SAMPLE_PASSAGES[1].text);

  const preview = buildWizardPreviewProfile(state, 1_700_000_000_000);
  assert.equal(validateProfile(preview).valid, true);
  assert.equal(preview.name, 'Evening Mint Study');
  assert.equal(preview.maxLineWidthCh, 50);

  const finalized = finalizeWizardProfile(state, 1_700_000_000_000);
  assert.equal(finalized.valid, true);
  assert.ok(finalized.profile);
  assert.equal(finalized.profile.fontFamily, 'serif');
  assert.equal(finalized.profile.disableAnimations, true);
  assert.equal(finalized.nextState.isSaved, true);
  assert.deepEqual(finalized.nextState.stepsCompleted, {
    font: true,
    spacing: true,
    color: true,
    review: true,
  });

  // Reset returns clean initial draft
  const reset = resetWizardState();
  assert.equal(reset.currentStepIndex, 0);
  assert.equal(reset.isSaved, false);
  assert.equal(reset.choices.fontPreference, 'inter');
});
