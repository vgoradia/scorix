# Scorix

I built this because every SAT prep tool I tried was either paywalled, generic, or just bad. I needed something that actually knew my weak spots and drilled me on them until I fixed them. So I built it myself.

Use this link to access Scorix: https://scorix-blond.vercel.app/

## What it does

Onboarding asks for your score, target, test date, and weak areas — then everything adapts to you. The dashboard shows your real numbers, not placeholders.

Practice mode generates unlimited SAT-style questions using Claude, calibrated to actual College Board difficulty. Every wrong answer gets saved and resurfaces automatically through spaced repetition until you stop getting it wrong.

There are 8 full-length practice tests in real SAT format — 98 questions, 2 hours 14 minutes, adaptive Module 2, and a 10-minute break timer between sections. After Math Module 2 you get a full score report with separate Math and R&W scores.

Everything tracks. Accuracy by topic, session history, streaks, time per question, mistake log with every wrong answer expandable.

## Stack

React, Vite, Claude API

## Setup

```bash
npm install
npm run dev
```

Add a `.env`:

VITE_ANTHROPIC_API_KEY=your_key_here

## SAT format

98 questions across 4 modules. R&W Module 1 → R&W Module 2 → 10 min break → Math Module 1 → Math Module 2. Module 2 difficulty adapts based on how you did in Module 1. No calculator restriction — Desmos is available the whole time.

Scoring: 200–800 per section, 400–1600 total.
