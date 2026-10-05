import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { resolveHoverAction } from '../lib/segment-hover';

describe('PDF sentence hover highlight', () => {
  it('highlights a sentence when the pointer moves onto it', () => {
    assert.deepEqual(resolveHoverAction('3', null), { type: 'switch', index: '3' });
  });

  it('clears the highlight when the pointer moves onto non-sentence content', () => {
    assert.deepEqual(resolveHoverAction(null, '3'), { type: 'clear' });
  });

  it('keeps the highlight when moving between fragments of the same sentence', () => {
    assert.deepEqual(resolveHoverAction('3', '3'), { type: 'keep' });
  });

  it('switches the highlight when moving between different sentences', () => {
    assert.deepEqual(resolveHoverAction('4', '3'), { type: 'switch', index: '4' });
  });

  it('stays idle when the pointer is over non-sentence content with nothing highlighted', () => {
    assert.deepEqual(resolveHoverAction(null, null), { type: 'keep' });
  });
});
