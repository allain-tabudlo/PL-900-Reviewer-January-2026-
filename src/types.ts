export type OptionId = "A" | "B" | "C" | "D" | "E";

export type Question = {
  id: number | string;
  questionNo?: number | null;
  question: string;
  options: { id: OptionId; text: string }[];
  answer: OptionId[];      // correct letters
  multi: boolean;          // multi-select if true
};
