import { ActionPanel, Action, List } from "@raycast/api";
import { getFavicon } from "@raycast/utils";
import { useEffect, useState, useMemo } from "react";
import { join } from "path";
import { homedir } from "os";
import * as fs from "fs"

const BOOKMARKS_PATH = join(homedir(), "/Library/Application Support/Sidekick/Default/Bookmarks");

export default function Command() {
  const bookmarks = useMemo(() => {
    return parseSidekickBookmark()
  }, []);
  const [searchText, setSearchText] = useState("");
  const [filteredBookmarks, setFilteredBookmarks] = useState(bookmarks);
  useEffect(() => {
    if (searchText.length > 0) {
      const filtered = bookmarks.filter((bookmark) => bookmark.name.toLowerCase().includes(searchText.toLowerCase()));
      setFilteredBookmarks(filtered);
    } else {
      setFilteredBookmarks(bookmarks);
    }
  }, [searchText]);

  return (
    <List
      onSearchTextChange={setSearchText}
      searchBarPlaceholder="Search sidekick bookmarks..."
      throttle
    >
      <List.Section title="Results" subtitle={bookmarks?.length + ""}>
        {filteredBookmarks?.map((bookmark) => (
          <SearchListItem key={bookmark.guid} bookmark={bookmark} />
        ))}
      </List.Section>
    </List>
  );
}

function SearchListItem({ bookmark }: { bookmark: Bookmark }) {
  return (
    <List.Item
      icon={getFavicon(bookmark.url)}
      title={bookmark.name}
      actions={
        <ActionPanel>
          <ActionPanel.Section>
            <Action.OpenInBrowser title="Open in Browser" url={bookmark.url} />
          </ActionPanel.Section>
        </ActionPanel>
      }
    />
  );
}

function walkEdge(node: Node, v: Visitor) {
  switch (node.type) {
    case "url":
      v.visit(node)
    case "folder":
      if (node.children === undefined) {
        return
      }
      node.children.forEach((child) => walkEdge(child, v))
  }
}

function parseSidekickBookmark(): Bookmark[] {
  const data = fs.readFileSync(BOOKMARKS_PATH, "utf-8");
  const json = JSON.parse(data);
  const v = new NodeVisitor();
  walkEdge(json.roots.bookmark_bar, v);
  return v.data;
}

interface Bookmark {
  name: string;
  url: string;
  guid: string
}

interface Node {
  name: string;
  guid: string;
  type: string;
  url: string;
  children: Node[];
}

interface Visitor {
  visit(node: Node): void;
}

class NodeVisitor implements Visitor {
  data: Bookmark[]
  constructor() {
    this.data = []
  }
  visit(node: Node) {
    this.data.push({
      name: node.name,
      url: node.url,
      guid: node.guid
    })
  }
}
