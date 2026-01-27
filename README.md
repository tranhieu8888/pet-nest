# WDP — Git Rules (Quick)

## 1) Không push trực tiếp `main`
- Luôn tạo branch → push branch → mở Pull Request  → merge.

## 2) Commit convention (bắt buộc)
Format:
```
[<USER>][<SCOPE>] <MESSAGE>
```

Ví dụ:
- `[HuyTQHE173113][Sign-in] Done refactor structure FE`
- `[HuyTQHE173113][DOCS][docs] Update README`

## 3) Branch naming
- `feature/<ticket>-<scope>-<desc>`
- `bugfix/<ticket>-<scope>-<desc>`

Ví dụ: `feature/TQHE173113-repo-erp-frontend-refactor-structure`

## 4) Workflow chuẩn (tránh conflict)

### Start task
```bash
git checkout main
git pull origin main
git checkout -b feature/<ticket>-<scope>-<desc>
```

### Trước khi push / tạo PR (bắt buộc)
```bash
git fetch origin
git rebase origin/main
```

Nếu đã push trước đó và vừa rebase:
```bash
git push --force-with-lease
```

### Commit + push
```bash
git add .
git commit -m "[USER][SCOPE] message"
git push -u origin <branch>
```

## 5) Lưu ý
- Không commit `.env`, key, token, database dump.
- PR nhỏ, sync `main` thường xuyên để ít conflict.
