# Digital Library Content

The site currently reads public library resources from `content/library/resources.json`.

To add a new resource:

1. Copy an existing entry in `resources.json`.
2. Fill in the English and Arabic titles and descriptions.
3. Add a thumbnail URL.
4. Add the final YouTube, Amazon, article, podcast, or official PDF URL.
5. Set `is_published` to `true`.
6. Restart local development or redeploy the site.

Important notes:

- Use only HTTPS URLs.
- External links open on the original platform in a new tab.
- Do not upload or host protected Amazon book files on this project.
- Unpublished entries stay hidden from the public page.
- A future admin table can replace `resources.json`, but that is out of scope for Phase 3C Light.
