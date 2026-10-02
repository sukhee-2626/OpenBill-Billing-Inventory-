# Contributing to OpenBill

Thanks for contributing! Here's how to get started.

## Setup

```bash
git clone https://github.com/yourusername/openbill.git
cd openbill
npm install
npm run dev
```

## Code Style

- Use TypeScript strict mode
- Use functional components with hooks
- Follow existing naming conventions
- Keep components small and focused
- Add comments for complex logic

## File Structure

- `/src/pages` - Route pages
- `/src/components` - Reusable components
- `/src/lib` - Utilities and helpers
- `/src/db` - Database schema and seeds
- `/src/types` - TypeScript interfaces

## Testing

```bash
npm run test
```

Write tests for:
- Tax calculations
- Currency formatting
- Data transformations
- Critical business logic

## Pull Requests

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## What to Contribute

- Bug fixes
- New invoice templates (JSON format)
- Translations (i18n files)
- UI improvements
- Documentation
- Test coverage

## Template Contributions

New templates go in `/src/templates/`. Follow existing JSON structure. See `classic.json` for reference.

## Questions?

Open an issue or discussion.
