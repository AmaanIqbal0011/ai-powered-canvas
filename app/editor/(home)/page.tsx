import { EditorHomeActions } from "./editor-home-actions";

/**
 * Editor home page — server component.
 *
 * Fetches project data server-side and passes it to the sidebar
 * (rendered by the layout). The interactive New Project button
 * is extracted into a small client component.
 */
export default function EditorPage() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 px-4">
      <h1 className="text-center text-lg font-semibold text-copy-primary">
        Create a project or open an existing one
      </h1>
      <p className="max-w-sm text-center text-sm text-copy-muted">
        Start a new architecture workspace, or choose a project from the
        sidebar.
      </p>
      <EditorHomeActions />
    </div>
  );
}
