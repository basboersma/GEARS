const githubOrganization = "gearsnl";

export interface GithubFileTreeNode {
  kind: "folder" | "file";
  id: string;
  name: string;
  path: string;
  size?: number;
  url: string;
  children?: GithubFileTreeNode[];
}

async function githubRequest<T>(
  path: string,
  token: string
): Promise<T | null> {
  const response = await fetch(`https://api.github.com${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error(
      `GitHub request failed (${response.status}): ${await response.text()}`
    );
  }
  return response.json() as Promise<T>;
}

export async function createOrganizationGithubRepository({
  name,
  description,
}: {
  name: string;
  description: string;
}) {
  const token = process.env.GITHUB_TOKEN?.trim();

  if (!token) {
    throw new Error("GITHUB_TOKEN is not configured.");
  }

  const response = await fetch(
    `https://api.github.com/orgs/${githubOrganization}/repos`,
    {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify({
        name,
        description,
        private: true,
        auto_init: true,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(
      `GitHub repository creation failed (${response.status}): ${error}`
    );
  }

  return response.json() as Promise<{ html_url: string }>;
}

export async function listOrganizationGithubTree(repoName: string) {
  const token = process.env.GITHUB_TOKEN?.trim();
  if (!token) {
    return null;
  }

  const repository = await githubRequest<{
    default_branch: string;
  }>(`/repos/${githubOrganization}/${encodeURIComponent(repoName)}`, token);
  if (!repository) {
    return null;
  }

  const tree = await githubRequest<{
    tree: { path: string; type: "blob" | "tree"; size?: number }[];
  }>(
    `/repos/${githubOrganization}/${encodeURIComponent(repoName)}/git/trees/${encodeURIComponent(repository.default_branch)}?recursive=1`,
    token
  );
  if (!tree) {
    return null;
  }

  const root: GithubFileTreeNode[] = [];
  const folders = new Map<string, GithubFileTreeNode[]>();
  folders.set("", root);

  for (const entry of tree.tree) {
    const parts = entry.path.split("/");
    const name = parts.pop();
    if (!name) {
      continue;
    }
    const parentPath = parts.join("/");
    const parent = folders.get(parentPath);
    if (!parent) {
      continue;
    }
    const encodedPath = entry.path
      .split("/")
      .map((part) => encodeURIComponent(part))
      .join("/");
    const baseUrl = `https://github.com/${githubOrganization}/${encodeURIComponent(repoName)}`;
    if (entry.type === "tree") {
      const children: GithubFileTreeNode[] = [];
      parent.push({
        kind: "folder",
        id: entry.path,
        name,
        path: entry.path,
        url: `${baseUrl}/tree/${encodeURIComponent(repository.default_branch)}/${encodedPath}`,
        children,
      });
      folders.set(entry.path, children);
    } else {
      parent.push({
        kind: "file",
        id: entry.path,
        name,
        path: entry.path,
        size: entry.size,
        url: `${baseUrl}/blob/${encodeURIComponent(repository.default_branch)}/${encodedPath}`,
      });
    }
  }

  return root;
}
