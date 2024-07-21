import RunEditor from './RunEditor';
import { useTranslations } from 'next-intl';
import { RunMessages } from '@/types/run';
import { PriorityMessages } from '@/types/priority';
import { TestRunCaseStatusMessages } from '@/types/testRunCaseStatus';

export default function Page({ params }: { params: { projectId: string; runId: string; locale: string } }) {
  const t = useTranslations('Run');
  const messages: RunMessages = {
    backToRuns: t('back_to_runs'),
    updating: t('updating'),
    update: t('update'),
    progress: t('progress'),
    refresh: t('refresh'),
    id: t('id'),
    title: t('title'),
    pleaseEnter: t('please_enter'),
    description: t('description'),
    new: t('new'),
    inProgress: t('inProgress'),
    underReview: t('underReview'),
    rejected: t('rejected'),
    done: t('done'),
    closed: t('closed'),
    priority: t('priority'),
    actions: t('actions'),
    status: t('status'),
    selectTestCase: t('select_test_case'),
    testCaseSelection: t('test_case_selection'),
    includeInRun: t('include_in_run'),
    excludeFromRun: t('exclude_from_run'),
    noCasesFound: t('no_cases_found'),
    areYouSureLeave: t('are_you_sure_leave'),
    type: t('type'),
    preconditions: t('preconditions'),
    expectedResult: t('expected_result'),
    detailsOfTheStep: t('details_of_the_step'),
    close: t('close'),
  };

  const rcst = useTranslations('RunCaseStatus');
  const testRunCaseStatusMessages: TestRunCaseStatusMessages = {
    untested: rcst('untested'),
    passed: rcst('passed'),
    failed: rcst('failed'),
    retest: rcst('retest'),
    skipped: rcst('skipped'),
  };

  const pt = useTranslations('Priority');
  const priorityMessages: PriorityMessages = {
    critical: pt('critical'),
    high: pt('high'),
    medium: pt('medium'),
    low: pt('low'),
  };

  return (
    <RunEditor
      projectId={params.projectId}
      runId={params.runId}
      messages={messages}
      testRunCaseStatusMessages={testRunCaseStatusMessages}
      priorityMessages={priorityMessages}
      locale={params.locale}
    />
  );
}
