<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Cognify UI lives in src/components/cognify and renders client-only on `/` because progress is kept in browser storage.
- Answer assessment runs in the `/api/assessment` server route using src/server/evaluator (rubric fallback, pluggable AI provider) — keeps the original fetch contract.
