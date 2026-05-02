import React from "react";
import keyword_extractor from "keyword-extractor";

type Props = {
  answer: string;
  setBlankAnswer: React.Dispatch<React.SetStateAction<string>>;
};

const blank = "_____";

const BlankAnswerInput = ({ answer, setBlankAnswer }: Props) => {
  const keywords = React.useMemo(() => {
    const words = keyword_extractor.extract(answer, {
      language: "english",
      remove_digits: true,
      return_changed_case: false,
      remove_duplicates: false,
    });
    const shuffled = words.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 2);
  }, [answer]);

  const answerWithBlanks = React.useMemo(() => {
    return keywords.reduce((acc, curr) => {
      return acc.replaceAll(curr, blank);
    }, answer);
  }, [answer, keywords]);

  // If no keywords were detected and nothing was replaced, mask a sensible
  // portion of the answer so the correct answer is not displayed to the user.
  const finalAnswerWithBlanks = React.useMemo(() => {
    if (answerWithBlanks === answer) {
      return answer.replace(/\S+/, blank);
    }
    return answerWithBlanks;
  }, [answerWithBlanks, answer]);

  React.useEffect(() => {
    setBlankAnswer(finalAnswerWithBlanks);
  }, [finalAnswerWithBlanks, setBlankAnswer]);

  const isCodeLike =
    answer.includes("\n") ||
    answer.trim().startsWith("```") ||
    /\bfunction\b|=>|console\.log|\bvar\b|\bconst\b|\blet\b/.test(answer);

  if (isCodeLike) {
    return (
      <div className="flex justify-start w-full mt-4">
        <pre className="text-sm font-mono whitespace-pre-wrap bg-slate-100 dark:bg-slate-900 p-3 rounded-md w-full overflow-auto">
          {finalAnswerWithBlanks.split(blank).map((part, index) => {
            return (
              <React.Fragment key={index}>
                {part}
                {index === finalAnswerWithBlanks.split(blank).length - 1 ? (
                  ""
                ) : (
                  <input
                    data-blank-answer-input="true"
                    className="inline-block align-middle text-sm font-mono border-b-2 border-black dark:border-white w-36 focus:outline-none bg-transparent"
                    type="text"
                  />
                )}
              </React.Fragment>
            );
          })}
        </pre>
      </div>
    );
  }

  return (
    <div className="flex justify-start w-full mt-4">
      <h1 className="text-xl font-semibold">
        {finalAnswerWithBlanks.split(blank).map((part, index) => {
          return (
            <React.Fragment key={index}>
              {part}
              {index === finalAnswerWithBlanks.split(blank).length - 1 ? (
                ""
              ) : (
                <input
                  data-blank-answer-input="true"
                  className="text-center border-b-2 border-black dark:border-white w-28 focus:border-2 focus:border-b-4 focus:outline-none"
                  type="text"
                />
              )}
            </React.Fragment>
          );
        })}
      </h1>
    </div>
  );
};

export default BlankAnswerInput;
