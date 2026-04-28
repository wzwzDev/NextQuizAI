export class NormalizedText {
  private constructor(private readonly normalizedValue: string) {}

  static from(value: string) {
    return new NormalizedText(value.toLowerCase().replace(/\s+/g, " ").trim());
  }

  get value() {
    return this.normalizedValue;
  }

  get isEmpty() {
    return this.normalizedValue.length === 0;
  }

  get tokens() {
    return this.normalizedValue.split(" ").filter(Boolean);
  }

  containsSequence(phrase: NormalizedText) {
    const fullTokens = this.tokens;
    const phraseTokens = phrase.tokens;

    if (
      !fullTokens.length ||
      !phraseTokens.length ||
      phraseTokens.length > fullTokens.length
    ) {
      return false;
    }

    const maxStart = fullTokens.length - phraseTokens.length;
    for (let start = 0; start <= maxStart; start++) {
      let matches = true;
      for (let offset = 0; offset < phraseTokens.length; offset++) {
        if (fullTokens[start + offset] !== phraseTokens[offset]) {
          matches = false;
          break;
        }
      }

      if (matches) {
        return true;
      }
    }

    return false;
  }

  hasSingleAdjacentSwap(other: NormalizedText) {
    const expected = this.value;
    const userInput = other.value;

    if (expected.length !== userInput.length || expected.length < 2) {
      return false;
    }

    const mismatchIndexes: number[] = [];
    for (let index = 0; index < expected.length; index++) {
      if (expected[index] !== userInput[index]) {
        mismatchIndexes.push(index);
        if (mismatchIndexes.length > 2) {
          return false;
        }
      }
    }

    if (mismatchIndexes.length !== 2) {
      return false;
    }

    const [first, second] = mismatchIndexes;
    if (second !== first + 1) {
      return false;
    }

    return expected[first] === userInput[second] && expected[second] === userInput[first];
  }
}