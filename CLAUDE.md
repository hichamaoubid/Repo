# CLAUDE.md

Working agreements for Claude Code in this repository.

## 1. Discipline and test-driven development
- Before starting a complex task, state briefly and exactly what you will do (a "Commitment Statement").
- Prefer systematic test-driven development: write a failing test, make it pass, then refactor. Don't guess.
- Stay on the agreed task list. Don't add scope that wasn't asked for.

## 2. Security review on every change
- Check every piece of code you write or modify for real vulnerabilities: injection (SQL, command, XSS), exposed secrets or credentials, weak authentication or authorization, unsafe deserialization, and insecure defaults.
- Fix critical issues as you go and report them briefly.
- Don't report low-value nitpicks.
- Never commit secrets. Use environment variables and keep `.env` files in `.gitignore`.

## 3. Technical SEO (web and content files)
- Use semantic HTML (`header`, `nav`, `main`, `article`, `footer`).
- Each page has one `<h1>` and a logical heading order.
- Include a unique `<title>`, a `<meta name="description">`, a canonical URL, and Open Graph and Twitter tags where relevant.
- Include `lang` on `<html>`, descriptive link text, `alt` text on images, and structured data (JSON-LD) where it adds value.
- Keep pages fast: optimized images, lazy loading, and minimal render-blocking resources.

## 4. Design and accessibility (UI and frontend)
- Clean, modern design with a consistent spacing and type scale.
- Meet WCAG 2.2 AA: sufficient contrast, full keyboard navigation, visible focus states, correct ARIA (only where native semantics fall short), labelled form controls, and support for `prefers-reduced-motion` and `prefers-color-scheme`.
- Responsive down to phone width, with no horizontal scroll.
- On design feedback, change only the affected element. Don't rewrite whole files unnecessarily.

## 5. Task management
For multi-step projects:
1. Write an explicit markdown to-do list in the scratchpad.
2. Do one step at a time.
3. Tick each step off when it's done.
4. Don't stray from the task.

## Project status
The repository is newly initialized. No stack or tooling has been chosen yet. Update this section once a language, framework, test runner, and build/lint commands are in place.
