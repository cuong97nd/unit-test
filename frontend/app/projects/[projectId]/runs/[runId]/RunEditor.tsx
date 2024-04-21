"use client";
import React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Input,
  Textarea,
  Select,
  SelectItem,
  Tooltip,
  Listbox,
  ListboxItem,
  Divider,
  Selection,
  DropdownTrigger,
  Dropdown,
  DropdownMenu,
  DropdownItem,
} from "@nextui-org/react";
import {
  Save,
  ArrowLeft,
  Folder,
  ChevronDown,
  CopyPlus,
  CopyMinus,
} from "lucide-react";
import TestCaseSelector from "./TestCaseSelector";
import { testRunStatus } from "@/config/selection";
import { RunType, RunCaseType, RunCaseInfoType } from "@/types/run";
import { CaseType } from "@/types/case";
import { FolderType } from "@/types/folder";
import {
  fetchRun,
  updateRun,
  fetchRunCases,
  createRunCase,
  updateRunCase,
  bulkCreateRunCases,
  deleteRunCase,
  bulkDeleteRunCases,
} from "../runsControl";
import { fetchFolders } from "../../folders/foldersControl";
import { fetchCases } from "../../folders/[folderId]/cases/caseControl";

const defaultTestRun = {
  id: 0,
  name: "",
  configurations: 0,
  description: "",
  state: 0,
  projectId: 0,
};

type Props = {
  projectId: string;
  runId: string;
};

export default function RunEditor({ projectId, runId }: Props) {
  const [testRun, setTestRun] = useState<RunType>(defaultTestRun);
  const [folders, setFolders] = useState([]);
  const [runCases, setRunCases] = useState<RunCaseType[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set([]));
  const [selectedFolder, setSelectedFolder] = useState<FolderType>({});
  const [testcases, setTestCases] = useState<CaseType[]>([]);
  const [isNameInvalid, setIsNameInvalid] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    async function fetchDataEffect() {
      try {
        const runData = await fetchRun(runId);
        setTestRun(runData);
        const foldersData = await fetchFolders(projectId);
        setFolders(foldersData);
      } catch (error: any) {
        console.error("Error in effect:", error.message);
      }
    }

    fetchDataEffect();
  }, []);

  useEffect(() => {
    async function fetchCasesData() {
      if (selectedFolder && selectedFolder.id) {
        try {
          const latestRunCases = await fetchRunCases(runId);
          setRunCases(latestRunCases);

          const testCasesData = await fetchCases(selectedFolder.id);
          // Check if each testCase has an association with testRun
          // and add "isIncluded" property
          const updatedTestCasesData = testCasesData.map((testCase) => {
            const runCase = latestRunCases.find(
              (runCase) => runCase.caseId === testCase.id
            );

            const isIncluded = runCase ? true : false;
            const runStatus = runCase ? runCase.status : 0;
            return {
              ...testCase,
              isIncluded,
              runStatus,
            };
          });

          setTestCases(updatedTestCasesData);
        } catch (error: any) {
          console.error("Error fetching cases data:", error.message);
        }
      }
    }

    fetchCasesData();
  }, [selectedFolder]);

  const handleChangeStatus = async (changeCaseId: number, status: number) => {
    await updateRunCase(runId, changeCaseId, status);
    setTestCases((prevTestCases) => {
      return prevTestCases.map((testCase) => {
        if (testCase.id === changeCaseId) {
          return { ...testCase, runStatus: status };
        }
        return testCase;
      });
    });
  };

  const handleIncludeExcludeCase = async (
    isInclude: boolean,
    clickedTestCaseId: number
  ) => {
    if (isInclude) {
      const createdRunCase = await createRunCase(runId, clickedTestCaseId);
      setRunCases((prevRunCases) => {
        return [...prevRunCases, createdRunCase];
      });
    } else {
      await deleteRunCase(runId, clickedTestCaseId);
      setRunCases((prevRunCases) => {
        return prevRunCases.filter(
          (runCase) => runCase.caseId !== clickedTestCaseId
        );
      });
    }

    setTestCases((prevTestCases) => {
      return prevTestCases.map((testCase) => {
        if (testCase.id === clickedTestCaseId) {
          return { ...testCase, isIncluded: isInclude };
        }
        return testCase;
      });
    });
  };

  const handleBulkIncludeExcludeCases = async (isInclude: boolean) => {
    let keys: number[] = [];
    if (selectedKeys === "all") {
      keys = testcases.map((item) => item.id);
    } else {
      keys = Array.from(selectedKeys).map(Number);
    }

    const runCaseInfo: RunCaseInfoType[] = keys.map((caseId) => ({
      runId: runId,
      caseId: caseId,
    }));
    if (isInclude) {
      const createdRunCases = await bulkCreateRunCases(runCaseInfo);
      setRunCases((prevRunCases) => [...prevRunCases, ...createdRunCases]);
    } else {
      await bulkDeleteRunCases(runCaseInfo);
      setRunCases((prevRunCases) => {
        return prevRunCases.filter((runCase) => {
          return !runCaseInfo.some((info) => info.caseId === runCase.caseId);
        });
      });
    }

    const updatedTestCases = testcases.map((testcase) => {
      if (keys.includes(testcase.id)) {
        return { ...testcase, isIncluded: isInclude };
      }
      return testcase;
    });
    setTestCases(updatedTestCases);

    setSelectedKeys(new Set([]));
  };

  const baseClass = "";
  const selectedClass = `${baseClass} bg-neutral-200 dark:bg-neutral-700`;

  return (
    <>
      <div className="border-b-1 dark:border-neutral-700 w-full p-3 flex items-center justify-between">
        <div className="flex items-center">
          <Tooltip content="Back to runs" placement="left">
            <Button
              isIconOnly
              size="sm"
              className="rounded-full bg-neutral-50 dark:bg-neutral-600"
              onPress={() => router.push(`/projects/${projectId}/runs`)}
            >
              <ArrowLeft size={16} />
            </Button>
          </Tooltip>
          <h3 className="font-bold ms-2">{testRun.name}</h3>
        </div>
        <Button
          startContent={<Save size={16} />}
          size="sm"
          color="primary"
          isLoading={isUpdating}
          onPress={async () => {
            setIsUpdating(true);
            await updateRun(testRun);
            setIsUpdating(false);
          }}
        >
          {isUpdating ? "Updating..." : "Update"}
        </Button>
      </div>

      <div className="container mx-auto max-w-5xl pt-6 px-6 flex-grow">
        <h6>Basic</h6>
        <Input
          size="sm"
          type="text"
          variant="bordered"
          label="Name"
          value={testRun.name}
          isInvalid={isNameInvalid}
          errorMessage={isNameInvalid ? "please enter name" : ""}
          onChange={(e) => {
            setTestRun({ ...testRun, name: e.target.value });
          }}
          className="mt-3"
        />

        <Textarea
          size="sm"
          variant="bordered"
          label="Description"
          placeholder="Test run description"
          value={testRun.description}
          onValueChange={(changeValue) => {
            setTestRun({ ...testRun, description: changeValue });
          }}
          className="mt-3"
        />

        <div>
          <Select
            size="sm"
            variant="bordered"
            selectedKeys={[testRunStatus[testRun.state].uid]}
            onSelectionChange={(e) => {
              const selectedUid = e.anchorKey;
              const index = testRunStatus.findIndex(
                (template) => template.uid === selectedUid
              );
              setTestRun({ ...testRun, state: index });
            }}
            label="status"
            className="mt-3 max-w-xs"
          >
            {testRunStatus.map((state, index) => (
              <SelectItem key={state.uid} value={index}>
                {state.name}
              </SelectItem>
            ))}
          </Select>
        </div>

        <Divider className="my-6" />
        <div className="flex items-center justify-between">
          <h6 className="h-8">Select test cases</h6>
          <div>
            {selectedKeys.size > 0 || selectedKeys === "all" ? (
              <Dropdown>
                <DropdownTrigger>
                  <Button
                    size="sm"
                    color="primary"
                    endContent={<ChevronDown size={16} />}
                  >
                    Test case selection
                  </Button>
                </DropdownTrigger>
                <DropdownMenu aria-label="test case select actions">
                  <DropdownItem
                    startContent={<CopyPlus size={16} />}
                    onClick={() => handleBulkIncludeExcludeCases(true)}
                  >
                    Include selected cases in run
                  </DropdownItem>
                  <DropdownItem
                    startContent={<CopyMinus size={16} />}
                    onClick={() => handleBulkIncludeExcludeCases(false)}
                  >
                    Exclude selected cases from run
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            ) : (
              <></>
            )}
          </div>
        </div>

        <div className="mt-3 flex rounded-small border-2 dark:border-neutral-700">
          <div className="w-3/12 border-r-1 dark:border-neutral-700">
            <Listbox aria-label="Listbox Variants" variant="light">
              {folders.map((folder, index) => (
                <ListboxItem
                  key={index}
                  onClick={() => setSelectedFolder(folder)}
                  startContent={
                    <Folder size={20} color="#F7C24E" fill="#F7C24E" />
                  }
                  className={
                    selectedFolder && folder.id === selectedFolder.id
                      ? selectedClass
                      : baseClass
                  }
                >
                  {folder.name}
                </ListboxItem>
              ))}
            </Listbox>
          </div>
          <div className="w-9/12">
            <TestCaseSelector
              cases={testcases}
              selectedKeys={selectedKeys}
              onSelectionChange={setSelectedKeys}
              onStatusChange={handleChangeStatus}
              onIncludeCase={(includeTestId) =>
                handleIncludeExcludeCase(true, includeTestId)
              }
              onExcludeCase={(excludeCaseId) =>
                handleIncludeExcludeCase(false, excludeCaseId)
              }
            />
          </div>
        </div>
      </div>
    </>
  );
}
