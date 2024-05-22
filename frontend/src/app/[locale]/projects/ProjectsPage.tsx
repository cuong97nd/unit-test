'use client';
import { useEffect, useState, useContext } from 'react';
import { Button } from '@nextui-org/react';
import { Plus } from 'lucide-react';
import { TokenContext } from '@/src/app/[locale]/TokenProvider';
import { ProjectType, ProjectsMessages } from '@/types/project';
import ProjectsTable from './ProjectsTable';
import ProjectDialog from './ProjectDialog';
import NeedSignedInDialog from './NeedSignedInDialog';
import { fetchProjects, createProject, updateProject, deleteProject } from './projectsControl';

export type Props = {
  messages: ProjectsMessages;
  locale: string;
};

export default function ProjectsPage({ messages, locale }: Props) {
  const context = useContext(TokenContext);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    async function fetchDataEffect() {
      try {
        const data = await fetchProjects();
        setProjects(data);
      } catch (error: any) {
        console.error('Error in effect:', error.message);
      }
    }

    fetchDataEffect();
  }, []);

  // dialog
  const [isNeedSignedInDialogOpen, setIsNeedSignedInDialogOpen] = useState(false);
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectType | null>(null);
  const openDialogForCreate = () => {
    if (!context.token || !context.token.user) {
      setIsNeedSignedInDialogOpen(true);
      return;
    }

    setIsProjectDialogOpen(true);
    setEditingProject(null);
  };

  const closeDialog = () => {
    setIsProjectDialogOpen(false);
    setEditingProject(null);
  };

  const onSubmit = async (name: string, detail: string, isPublic: boolean) => {
    if (editingProject) {
      const updatedProject = await updateProject(editingProject.id, name, detail, isPublic);
      const updatedProjects = projects.map((project) => (project.id === updatedProject.id ? updatedProject : project));
      setProjects(updatedProjects);
    } else {
      const newProject = await createProject(name, detail, isPublic, context.token.user.id);
      setProjects([...projects, newProject]);
    }
    closeDialog();
  };

  const onEditClick = (project: ProjectType) => {
    setEditingProject(project);
    setIsProjectDialogOpen(true);
  };

  const onDeleteClick = async (projectId: number) => {
    try {
      await deleteProject(projectId);
      setProjects(projects.filter((project) => project.id !== projectId));
    } catch (error: any) {
      console.error('Error deleting project:', error);
    }
  };

  return (
    <div className="container mx-auto max-w-3xl pt-16 px-6 flex-grow">
      <div className="w-full p-3 flex items-center justify-between">
        <h3 className="font-bold">{messages.projectList}</h3>
        <div>
          <Button startContent={<Plus size={16} />} size="sm" color="primary" onClick={openDialogForCreate}>
            {messages.newProject}
          </Button>
        </div>
      </div>

      <ProjectsTable
        projects={projects}
        onEditProject={onEditClick}
        onDeleteProject={onDeleteClick}
        messages={messages}
        locale={locale}
      />

      <ProjectDialog
        isOpen={isProjectDialogOpen}
        editingProject={editingProject}
        onCancel={closeDialog}
        onSubmit={onSubmit}
        messages={messages}
      />

      <NeedSignedInDialog
        isOpen={isNeedSignedInDialogOpen}
        onCancel={() => setIsNeedSignedInDialogOpen(false)}
        messages={messages}
        locale={locale}
      />
    </div>
  );
}
