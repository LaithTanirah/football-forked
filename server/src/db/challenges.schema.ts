import { pgTable, serial, text, integer } from "drizzle-orm/pg-core";

export const challenges = pgTable("challenges", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
});

export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  challengeId: integer("challenge_id").notNull(),
  question: text("question").notNull(),
  correctAnswer: text("correct_answer").notNull(),
});

export const userAnswers = pgTable("user_answers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  questionId: integer("question_id").notNull(),
  answer: text("answer").notNull(),
  isCorrect: integer("is_correct").notNull(),
});
