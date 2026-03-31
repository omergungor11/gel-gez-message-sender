# Workflow Rules

## Task Workflow

### Pre-Task
1. Read `ggr-tasks/task-index.md` for project status
2. Read phase file for task details
3. Check all dependencies are COMPLETED
4. Update task status to IN_PROGRESS

### During Task
- Follow acceptance criteria strictly
- Run `npx tsx` to test after changes
- Keep changes focused on task scope

### Post-Task
1. Verify all acceptance criteria
2. Run test command for the module
3. Update `ggr-tasks/task-index.md` (status + dashboard)
4. Update `ggr-docs/CHANGELOG.md`
5. Git commit: `feat(TASK-XXX): title`
6. Check blocked tasks, unblock if ready

## Commit Conventions

```
feat(TASK-XXX): description     # New feature
fix(TASK-XXX): description      # Bug fix
refactor(TASK-XXX): description # Refactoring
docs(TASK-XXX): description     # Documentation
chore(TASK-XXX): description    # Tooling/config
test(TASK-XXX): description     # Tests
```

## Validation Commands

```bash
npx tsx src/scraper/trendScraper.ts     # Test scraper
npx tsx src/scraper/detailScraper.ts    # Test detail scraper
npx tsx src/social/generator.ts         # Test social generator
DRY_RUN=true npx tsx src/pipeline/index.ts  # Test pipeline
npm run dev                              # Test panel
```
