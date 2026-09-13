import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeRawText } from '../lib/text-normalizer';

describe('Text Normalizer & Sentence Segmentation', () => {
  it('correctly segments the complete 87-sentence academic paper benchmark', () => {
    const inputParagraphs = [
      "Dr. Smith conducted the experiment at Wayne State University. The study included 120 participants from the U.S. and Canada. Prof. J. R. Thompson independently reviewed the experimental protocol.",
      "The proposed method improves performance by 4.7%. The baseline achieved an accuracy of 82.35%, whereas our model achieved 87.05%. The learning rate was set to 0.001. A threshold of 0.5 was used during classification. The measured value was 3.14159 units.",
      "Several preprocessing techniques were considered, e.g., normalization, standardization, and feature selection. We selected normalization because it performed consistently across datasets. Other techniques, i.e., techniques requiring additional training data, were excluded. Similar observations have been reported by Smith et al. in previous work. Brown et al. also reached a similar conclusion.",
      "The architecture is shown in Fig. 2. Additional implementation details are provided in Sec. 4.2. The mathematical formulation appears in Eq. 3. The complete results are reported in Table 5. See Appendix A.2 for additional examples.",
      "The experiment was conducted at approximately 3 p.m. on Monday. Data collection ended at 5:30 p.m. The samples were then transferred to the laboratory.",
      "The model was implemented using Python 3.12.2. We used PyTorch v2.4.1 and CUDA 12.6. The previous implementation used TensorFlow 2.15.0. All experiments were executed using model.py.",
      "The server was available at 192.168.1.10. Additional documentation is available at https://example.com/research/docs. The project homepage is www.example.org. Questions may be sent to researcher@example.edu.",
      "The dataset contains measurements of E. coli growth under different environmental conditions. The concentration of NaCl was approximately 0.25 M. Samples were collected every 2.5 h.",
      "The hypothesis was statistically significant (p = 0.032). However, the second experiment was not significant (p > 0.05). The average score was 9.8 ± 1.2. The confidence interval ranged from 2.1 to 4.6.",
      "The method consists of three stages: (1) preprocessing, (2) representation learning, and (3) classification. Step 1.1 removes invalid samples. Step 1.2 normalizes the remaining observations. Step 2.1 constructs the feature representation.",
      "Our first research question is R.Q.1: Can the proposed method improve classification accuracy? R.Q.2 examines whether the improvement generalizes across datasets.",
      "The authors stated, \"The proposed method significantly improves accuracy.\" This result was independently verified. Another participant responded, \"I am not certain...perhaps additional experiments are necessary.\" The observation was recorded without modification.",
      "Earlier studies reported mixed results [1, 2, 3]. A more recent investigation [12] reached a different conclusion. This difference may be caused by dataset characteristics [13, Sec. IV-B]. Similar behavior has also been observed elsewhere [14, Fig. 3].",
      "Smith (2024) proposed the original method. Smith et al. (2025) subsequently extended the architecture. A third study by A. B. Johnson et al. (2026) evaluated both approaches.",
      "The DOI is 10.1145/1234567.1234568. The corresponding arXiv identifier is arXiv:2401.12345. The dataset is stored under release v1.2.3. None of these periods should create artificial sentence boundaries.",
      "Consider the abbreviation No. 5 in the experimental configuration. Approx. 20 samples were removed during preprocessing. The result should be compared with vs. baseline methods only when the experimental conditions are identical.",
      "The system achieved 91.2% accuracy, i.e., an improvement of 3.4 percentage points. This improvement was observed on the U.S. dataset as well as the U.K. dataset. It was not observed on all E.U. datasets.",
      "The following statement contains an abbreviation at the end of a sentence: The meeting occurred at 4 p.m. The next sentence must still be detected correctly.",
      "The following statement contains a citation at the end of a sentence [21]. The next sentence begins here.",
      "The following statement ends with parentheses (see Fig. 7). The next sentence begins after the closing parenthesis.",
      "The authors described the result as \"unexpected.\" Nevertheless, the experiment was repeated.",
      "Was the improvement statistically significant? Yes, it was. Does the sentence detector recognize question marks? It should. What about exclamation marks? They should also terminate sentences!",
      "This sentence uses an ellipsis...but continues with the same thought. Whether this should be treated as one sentence depends on the segmentation policy. This sentence ends normally.",
      "A value such as 1.0 should not become two sentences. Neither should 10.5.6 if it represents a software version, although such version formats are unusual. An IP address such as 127.0.0.1 should remain intact.",
      "The file names results.csv, experiment.log, paper.pdf, and config.json should not create sentence boundaries. Likewise, domain names such as openai.com, github.com, and example.edu should remain intact.",
      "Finally, this is the last sentence. If the reader highlights this entire sentence correctly, the basic test is complete."
    ];

    const expectedSentences = [
      "Dr. Smith conducted the experiment at Wayne State University.",
      "The study included 120 participants from the U.S. and Canada.",
      "Prof. J. R. Thompson independently reviewed the experimental protocol.",
      "The proposed method improves performance by 4.7%.",
      "The baseline achieved an accuracy of 82.35%, whereas our model achieved 87.05%.",
      "The learning rate was set to 0.001.",
      "A threshold of 0.5 was used during classification.",
      "The measured value was 3.14159 units.",
      "Several preprocessing techniques were considered, e.g., normalization, standardization, and feature selection.",
      "We selected normalization because it performed consistently across datasets.",
      "Other techniques, i.e., techniques requiring additional training data, were excluded.",
      "Similar observations have been reported by Smith et al. in previous work.",
      "Brown et al. also reached a similar conclusion.",
      "The architecture is shown in Fig. 2.",
      "Additional implementation details are provided in Sec. 4.2.",
      "The mathematical formulation appears in Eq. 3.",
      "The complete results are reported in Table 5.",
      "See Appendix A.2 for additional examples.",
      "The experiment was conducted at approximately 3 p.m. on Monday.",
      "Data collection ended at 5:30 p.m.",
      "The samples were then transferred to the laboratory.",
      "The model was implemented using Python 3.12.2.",
      "We used PyTorch v2.4.1 and CUDA 12.6.",
      "The previous implementation used TensorFlow 2.15.0.",
      "All experiments were executed using model.py.",
      "The server was available at 192.168.1.10.",
      "Additional documentation is available at https://example.com/research/docs.",
      "The project homepage is www.example.org.",
      "Questions may be sent to researcher@example.edu.",
      "The dataset contains measurements of E. coli growth under different environmental conditions.",
      "The concentration of NaCl was approximately 0.25 M.",
      "Samples were collected every 2.5 h.",
      "The hypothesis was statistically significant (p = 0.032).",
      "However, the second experiment was not significant (p > 0.05).",
      "The average score was 9.8 ± 1.2.",
      "The confidence interval ranged from 2.1 to 4.6.",
      "The method consists of three stages: (1) preprocessing, (2) representation learning, and (3) classification.",
      "Step 1.1 removes invalid samples.",
      "Step 1.2 normalizes the remaining observations.",
      "Step 2.1 constructs the feature representation.",
      "Our first research question is R.Q.1: Can the proposed method improve classification accuracy?",
      "R.Q.2 examines whether the improvement generalizes across datasets.",
      "The authors stated, \"The proposed method significantly improves accuracy.\"",
      "This result was independently verified.",
      "Another participant responded, \"I am not certain...perhaps additional experiments are necessary.\"",
      "The observation was recorded without modification.",
      "Earlier studies reported mixed results [1, 2, 3].",
      "A more recent investigation [12] reached a different conclusion.",
      "This difference may be caused by dataset characteristics [13, Sec. IV-B].",
      "Similar behavior has also been observed elsewhere [14, Fig. 3].",
      "Smith (2024) proposed the original method.",
      "Smith et al. (2025) subsequently extended the architecture.",
      "A third study by A. B. Johnson et al. (2026) evaluated both approaches.",
      "The DOI is 10.1145/1234567.1234568.",
      "The corresponding arXiv identifier is arXiv:2401.12345.",
      "The dataset is stored under release v1.2.3.",
      "None of these periods should create artificial sentence boundaries.",
      "Consider the abbreviation No. 5 in the experimental configuration.",
      "Approx. 20 samples were removed during preprocessing.",
      "The result should be compared with vs. baseline methods only when the experimental conditions are identical.",
      "The system achieved 91.2% accuracy, i.e., an improvement of 3.4 percentage points.",
      "This improvement was observed on the U.S. dataset as well as the U.K. dataset.",
      "It was not observed on all E.U. datasets.",
      "The following statement contains an abbreviation at the end of a sentence: The meeting occurred at 4 p.m.",
      "The next sentence must still be detected correctly.",
      "The following statement contains a citation at the end of a sentence [21].",
      "The next sentence begins here.",
      "The following statement ends with parentheses (see Fig. 7).",
      "The next sentence begins after the closing parenthesis.",
      "The authors described the result as \"unexpected.\"",
      "Nevertheless, the experiment was repeated.",
      "Was the improvement statistically significant?",
      "Yes, it was.",
      "Does the sentence detector recognize question marks?",
      "It should.",
      "What about exclamation marks?",
      "They should also terminate sentences!",
      "This sentence uses an ellipsis...but continues with the same thought.",
      "Whether this should be treated as one sentence depends on the segmentation policy.",
      "This sentence ends normally.",
      "A value such as 1.0 should not become two sentences.",
      "Neither should 10.5.6 if it represents a software version, although such version formats are unusual.",
      "An IP address such as 127.0.0.1 should remain intact.",
      "The file names results.csv, experiment.log, paper.pdf, and config.json should not create sentence boundaries.",
      "Likewise, domain names such as openai.com, github.com, and example.edu should remain intact.",
      "Finally, this is the last sentence.",
      "If the reader highlights this entire sentence correctly, the basic test is complete."
    ];

    const rawInput = inputParagraphs.join('\n\n');
    const segments = normalizeRawText(rawInput);

    assert.equal(segments.length, expectedSentences.length, `Expected ${expectedSentences.length} segments, got ${segments.length}`);

    for (let i = 0; i < expectedSentences.length; i++) {
      assert.equal(segments[i].text, expectedSentences[i], `Mismatch at sentence index ${i}`);
    }
  });

  it('handles titles and author name initials without splitting', () => {
    const text = "Dr. Jane Doe and Prof. J. R. Thompson published the report.";
    const segs = normalizeRawText(text);
    assert.equal(segs.length, 1);
    assert.equal(segs[0].text, text);
  });

  it('distinguishes single-letter scientific units from name initials', () => {
    const text = "The concentration was 0.25 M. The reaction began immediately.";
    const segs = normalizeRawText(text);
    assert.equal(segs.length, 2);
    assert.equal(segs[0].text, "The concentration was 0.25 M.");
    assert.equal(segs[1].text, "The reaction began immediately.");
  });

  it('does not split inside citation brackets or parentheses', () => {
    const text = "See prior work [13, Sec. IV-B]. Additional details are in (see Fig. 7). Final conclusion here.";
    const segs = normalizeRawText(text);
    assert.equal(segs.length, 3);
    assert.equal(segs[0].text, "See prior work [13, Sec. IV-B].");
    assert.equal(segs[1].text, "Additional details are in (see Fig. 7).");
    assert.equal(segs[2].text, "Final conclusion here.");
  });

  it('preserves URLs, emails, file extensions, and IP addresses intact', () => {
    const text = "Visit https://example.com/docs or mail info@example.org. Check 127.0.0.1 and file report.pdf.";
    const segs = normalizeRawText(text);
    assert.equal(segs.length, 2);
    assert.equal(segs[0].text, "Visit https://example.com/docs or mail info@example.org.");
    assert.equal(segs[1].text, "Check 127.0.0.1 and file report.pdf.");
  });

  it('preserves quotes and inline ellipses', () => {
    const text = 'The author said, "The hypothesis holds." Furthermore, testing...continues today.';
    const segs = normalizeRawText(text);
    assert.equal(segs.length, 2);
    assert.equal(segs[0].text, 'The author said, "The hypothesis holds."');
    assert.equal(segs[1].text, 'Furthermore, testing...continues today.');
  });

  it('preserves paragraph structure and newline metadata', () => {
    const text = "Paragraph one sentence.\n\nParagraph two sentence.";
    const segs = normalizeRawText(text);
    assert.equal(segs.length, 2);
    assert.equal(segs[0].paragraphIndex, 0);
    assert.equal(segs[0].trailingNewlines, 2);
    assert.equal(segs[1].paragraphIndex, 1);
  });
});
