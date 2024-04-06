"use client";
import React from "react";
import { FolderType } from "@/types/folder";
import { useEffect, useState } from "react";
import { Button, Listbox, ListboxItem } from "@nextui-org/react";
import { Folder, Plus } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import useGetCurrentIds from "@/utils/useGetCurrentIds";
import FolderDialog from "./FolderDialog";
import FolderEditMenu from "./FolderEditMenu";

import {
  fetchFolders,
  createFolder,
  updateFolder,
  deleteFolder,
} from "./foldersControl";

type Props = {
  projectId: string;
};

export default function FoldersPane({ projectId }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState<FolderType>({});

  const { folderId } = useGetCurrentIds();

  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false);
  const [editingFolder, setEditingProject] = useState<FolderType | null>(null);

  const openDialogForCreate = () => {
    setIsFolderDialogOpen(true);
    setEditingProject(null);
  };

  const closeDialog = () => {
    setIsFolderDialogOpen(false);
    setEditingProject(null);
  };

  const onSubmit = async (name: string, detail: string) => {
    if (editingFolder) {
      const updatedProject = await updateFolder(
        editingFolder.id,
        name,
        detail,
        projectId,
        null
      );
      const updatedProjects = folders.map((project) =>
        project.id === updatedProject.id ? updatedProject : project
      );
      setFolders(updatedProjects);
    } else {
      const newProject = await createFolder(name, detail, projectId, null);
      setFolders([...folders, newProject]);
    }
    closeDialog();
  };

  const onEditClick = (folder: FolderType) => {
    setEditingProject(folder);
    setIsFolderDialogOpen(true);
  };

  const onDeleteClick = async (folderId: number) => {
    await deleteFolder(folderId);
    router.push(`/projects/${projectId}/folders`);
  };

  useEffect(() => {
    async function fetchDataEffect() {
      try {
        const data = await fetchFolders(projectId);
        setFolders(data);

        const selectedFolderFromUrl = data.find(
          (folder) => folder.id === folderId
        );
        setSelectedFolder(selectedFolderFromUrl);

        // Redirect to the smallest folder ID page if the path is "projects/[projectId]/folders
        if (pathname === `/projects/${projectId}/folders`) {
          const smallestFolderId = Math.min(...data.map((folder) => folder.id));
          router.push(
            `/projects/${projectId}/folders/${smallestFolderId}/cases`
          );
        }
      } catch (error) {
        console.error("Error in effect:", error.message);
      }
    }

    fetchDataEffect();
  }, [folderId]);

  const baseClass = "px-3 py-2 rounded-none";
  const selectedClass = `${baseClass} bg-neutral-200 dark:bg-neutral-700`;

  return (
    <>
      <div className="w-64 min-h-[calc(100vh-64px)] border-r-1 dark:border-neutral-700">
        <Button
          startContent={<Plus size={16} />}
          size="sm"
          variant="bordered"
          className="m-2"
          onClick={openDialogForCreate}
        >
          New Folder
        </Button>
        <Listbox aria-label="Listbox Variants" variant="light" className="p-0">
          {folders.map((folder, index) => (
            <ListboxItem
              key={index}
              onClick={() =>
                router.push(`/projects/${projectId}/folders/${folder.id}/cases`)
              }
              startContent={<Folder size={20} color="#F7C24E" fill="#F7C24E" />}
              className={
                selectedFolder && folder.id === selectedFolder.id
                  ? selectedClass
                  : baseClass
              }
              endContent={
                <FolderEditMenu
                  folder={folder}
                  onEditClick={onEditClick}
                  onDeleteClick={onDeleteClick}
                />
              }
            >
              {folder.name}
            </ListboxItem>
          ))}
        </Listbox>
      </div>

      <FolderDialog
        isOpen={isFolderDialogOpen}
        editingFolder={editingFolder}
        onCancel={closeDialog}
        onSubmit={onSubmit}
      />
    </>
  );
}
