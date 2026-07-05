import { isGibberish, quizCreationSchema, SUGGESTED_TOPICS } from "@/schemas/forms/quiz";

describe("isGibberish", () => {
  describe("Suggested topics (should return false)", () => {
    it("should accept JavaScript", () => {
      expect(isGibberish("JavaScript")).toBe(false);
    });

    it("should accept React", () => {
      expect(isGibberish("React")).toBe(false);
    });

    it("should accept TypeScript", () => {
      expect(isGibberish("TypeScript")).toBe(false);
    });

    it("should accept all suggested topics regardless of case", () => {
      SUGGESTED_TOPICS.forEach((topic) => {
        expect(isGibberish(topic.toLowerCase())).toBe(false);
        expect(isGibberish(topic.toUpperCase())).toBe(false);
        expect(isGibberish(topic)).toBe(false);
      });
    });
  });

  describe("Empty and whitespace (should return true)", () => {
    it("should reject empty string", () => {
      expect(isGibberish("")).toBe(true);
    });

    it("should reject whitespace only", () => {
      expect(isGibberish("   ")).toBe(true);
    });

    it("should reject single space", () => {
      expect(isGibberish(" ")).toBe(true);
    });
  });

  describe("Word starting with number (should return true)", () => {
    it("should reject topic starting with number", () => {
      expect(isGibberish("123java")).toBe(true);
    });

    it("should reject topic with word starting with number", () => {
      expect(isGibberish("java 123")).toBe(true);
    });

    it("should reject multi-word where any word starts with number", () => {
      expect(isGibberish("web 2development")).toBe(true);
    });
  });

  describe("More numbers than letters (should return true)", () => {
    it("should reject word with more numbers than letters", () => {
      expect(isGibberish("java123456")).toBe(true);
    });

    it("should reject when word has 2 letters and 3 numbers", () => {
      expect(isGibberish("js123")).toBe(true);
    });

    it("should accept when equal numbers of letters and numbers", () => {
      expect(isGibberish("java123")).toBe(false);
    });

    it("should accept when more letters than numbers", () => {
      expect(isGibberish("java12")).toBe(false);
    });
  });

  describe("Consonant clusters > 3 (should return true)", () => {
    it("should reject word with too many consonants in a row", () => {
      expect(isGibberish("bcdfg")).toBe(true);
    });

    it("should reject word starting with consonant cluster > 2", () => {
      expect(isGibberish("string")).toBe(true); // str = 3 consonants start
    });

    it("should reject word ending with consonant cluster > 2", () => {
      expect(isGibberish("strength")).toBe(true); // ngth = 3+ consonants
    });

    it("should accept word with <= 2 consonant cluster", () => {
      expect(isGibberish("python")).toBe(false);
    });
  });

  describe("Q without U (should return true)", () => {
    it("should reject q not followed by u", () => {
      expect(isGibberish("qat")).toBe(true);
    });

    it("should accept q followed by u even in middle", () => {
      expect(isGibberish("jaqua")).toBe(false); // qu is valid
    });

    it("should accept q followed by u", () => {
      expect(isGibberish("question")).toBe(false);
    });
  });

  describe("Rare consonant pairs (should return true)", () => {
    it("should reject dj pair", () => {
      expect(isGibberish("djo")).toBe(true);
    });

    it("should reject qw pair", () => {
      expect(isGibberish("qwerty")).toBe(true);
    });

    it("should reject jq pair", () => {
      expect(isGibberish("jqo")).toBe(true);
    });

    it("should reject xz pair", () => {
      expect(isGibberish("xzo")).toBe(true);
    });

    it("should reject zq pair", () => {
      expect(isGibberish("zqo")).toBe(true);
    });

    it("should reject vj pair", () => {
      expect(isGibberish("vjo")).toBe(true);
    });

    it("should reject fq pair", () => {
      expect(isGibberish("fqo")).toBe(true);
    });

    it("should reject kx pair", () => {
      expect(isGibberish("kxo")).toBe(true);
    });

    it("should reject zx pair", () => {
      expect(isGibberish("zxo")).toBe(true);
    });

    it("should reject wq pair", () => {
      expect(isGibberish("wqo")).toBe(true);
    });

    it("should reject xq pair", () => {
      expect(isGibberish("xqo")).toBe(true);
    });
  });

  describe("Vowel sequences > 2 (should return true)", () => {
    it("should reject 3+ vowels in a row", () => {
      expect(isGibberish("aeiou")).toBe(true);
    });

    it("should reject aaa", () => {
      expect(isGibberish("baaa")).toBe(true);
    });

    it("should reject eee", () => {
      expect(isGibberish("beee")).toBe(true);
    });

    it("should reject iiii", () => {
      expect(isGibberish("biiii")).toBe(true);
    });

    it("should accept 2 vowels in a row", () => {
      expect(isGibberish("beat")).toBe(false);
    });
  });

  describe("Repeated vowel (3+ same vowel - should return true)", () => {
    it("should reject a repeated 3+ times", () => {
      expect(isGibberish("aaab")).toBe(true);
    });

    it("should reject e repeated 3+ times", () => {
      expect(isGibberish("beee")).toBe(true);
    });

    it("should reject i repeated 3+ times", () => {
      expect(isGibberish("biiii")).toBe(true);
    });

    it("should reject o repeated 3+ times", () => {
      expect(isGibberish("booo")).toBe(true);
    });

    it("should reject u repeated 3+ times", () => {
      expect(isGibberish("buuu")).toBe(true);
    });

    it("should accept same vowel repeated only 2 times", () => {
      expect(isGibberish("beat")).toBe(false);
    });
  });

  describe("Missing vowel or consonant (should return true)", () => {
    it("should reject word with no vowels", () => {
      expect(isGibberish("xyz")).toBe(true);
    });

    it("should reject word with no consonants", () => {
      expect(isGibberish("aaa")).toBe(true);
    });

    it("should accept word with both vowels and consonants", () => {
      expect(isGibberish("coding")).toBe(false);
    });
  });

  describe("Multi-word topics", () => {
    it("should reject if any word is gibberish", () => {
      expect(isGibberish("web bcdfg")).toBe(true); // bcdfg is gibberish
    });

    it("should reject if any word starts with number", () => {
      expect(isGibberish("web 2development")).toBe(true);
    });

    it("should accept if all words are valid", () => {
      expect(isGibberish("web development")).toBe(false);
    });

    it("should handle multiple spaces between words", () => {
      expect(isGibberish("web    development")).toBe(false);
    });

    it("should reject if any word has rare patterns", () => {
      expect(isGibberish("web qwerty")).toBe(true);
    });
  });

  describe("Edge cases", () => {
    it("should reject single vowel without consonant", () => {
      expect(isGibberish("a")).toBe(true);
    });

    it("should reject single consonant", () => {
      expect(isGibberish("b")).toBe(true);
    });

    it("should accept short valid words like 'go'", () => {
      expect(isGibberish("go")).toBe(false);
    });

    it("should reject words starting with 3+ consonants cluster", () => {
      // xylophone starts with xyl (3 consonants including y)
      expect(isGibberish("xylophone")).toBe(true);
    });

    it("should accept words with numbers when letters dominate", () => {
      expect(isGibberish("java3")).toBe(false); // 4 letters, 1 number
    });
  });
});

describe("quizCreationSchema", () => {
  it("should accept valid quiz creation data", () => {
    const data = {
      topic: "JavaScript",
      type: "mcq",
      amount: 5,
    };

    const result = quizCreationSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("should reject empty topic", () => {
    const data = {
      topic: "",
      type: "mcq",
      amount: 5,
    };

    const result = quizCreationSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("should reject topic exceeding 50 characters", () => {
    const data = {
      topic: "a".repeat(51),
      type: "mcq",
      amount: 5,
    };

    const result = quizCreationSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("should accept topic with exactly 50 characters", () => {
    const data = {
      topic: "a".repeat(50),
      type: "mcq",
      amount: 5,
    };

    const result = quizCreationSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("should accept open_ended type", () => {
    const data = {
      topic: "JavaScript",
      type: "open_ended",
      amount: 5,
    };

    const result = quizCreationSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("should reject invalid quiz type", () => {
    const data = {
      topic: "JavaScript",
      type: "essay",
      amount: 5,
    };

    const result = quizCreationSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("should reject amount < 1", () => {
    const data = {
      topic: "JavaScript",
      type: "mcq",
      amount: 0,
    };

    const result = quizCreationSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("should reject amount > 10", () => {
    const data = {
      topic: "JavaScript",
      type: "mcq",
      amount: 11,
    };

    const result = quizCreationSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("should accept amount = 1", () => {
    const data = {
      topic: "JavaScript",
      type: "mcq",
      amount: 1,
    };

    const result = quizCreationSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("should accept amount = 10", () => {
    const data = {
      topic: "JavaScript",
      type: "mcq",
      amount: 10,
    };

    const result = quizCreationSchema.safeParse(data);
    expect(result.success).toBe(true);
  });
});
