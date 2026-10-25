import { afterEach, beforeEach, mock, test } from 'node:test';
import assert from 'node:assert/strict';
import * as student from '../src/services/studentService.js';
import * as supervisor from '../src/services/supervisorService.js';
import { getPublicResearch, getPublicResearchDetails } from '../src/services/publicService.js';
import { jsonBody } from '../src/services/apiClient.js';
import { persistSession } from '../src/services/session.js';

beforeEach(() => {
  const storage = new Map();
  globalThis.localStorage = { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: (key) => storage.delete(key) };
  globalThis.window = new EventTarget();
  persistSession({ role: 'student' }, `header.${btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }))}.signature`);
});
afterEach(() => mock.restoreAll());

test('student service URLs and methods match backend routes', async () => {
  const fetch = mock.method(globalThis, 'fetch', async () => Response.json({}));
  const cases = [
    [() => student.getStudentDashboard(), '/student/dashboard', 'GET'],
    [() => student.getStudentProfile(), '/student/me', 'GET'],
    [() => student.updateStudentProfile({ name: 'Student' }), '/student/me', 'PATCH'],
    [() => student.getAvailableSupervisors(), '/student/supervisors', 'GET'],
    [() => student.createResearchProposal({ title: 'Research' }), '/student/research', 'POST'],
    [() => student.updateResearchProposal('project', {}), '/student/research/project', 'PATCH'],
    [() => student.updateMilestoneProgress('project', 'milestone', 'completed'), '/student/research/project/milestones/milestone', 'PATCH'],
    [() => student.uploadResearchDocument('project', {}), '/student/research/project/documents', 'POST'],
    [() => student.requestSupervisorMeeting({}), '/student/meetings/request', 'POST'],
    [() => student.getStudentDeadlines(), '/student/deadlines', 'GET'],
    [() => student.getStudentNotifications(), '/student/notifications', 'GET'],
    [() => student.markAllNotificationsAsRead(), '/student/notifications/read-all', 'PATCH'],
    [() => student.markNotificationAsRead('notification'), '/student/notifications/notification/read', 'PATCH'],
  ];
  for (const [run, path, method] of cases) {
    await run();
    const [url, options] = fetch.mock.calls.at(-1).arguments;
    assert.equal(url, `/api${path}`);
    assert.equal(options.method || 'GET', method);
    assert.ok(options.headers.Authorization);
  }
});

test('supervisor service URLs and methods match backend routes', async () => {
  const fetch = mock.method(globalThis, 'fetch', async () => Response.json({}));
  const cases = [
    [() => supervisor.getSupervisorDashboard(), '/supervisor/dashboard', 'GET'],
    [() => supervisor.getAssignedStudents(), '/supervisor/students', 'GET'],
    [() => supervisor.getAssignedResearchList('ongoing'), '/supervisor/research?status=ongoing', 'GET'],
    [() => supervisor.getResearchDetails('p'), '/supervisor/research/p', 'GET'],
    [() => supervisor.reviewProposal('p', { status: 'approved' }), '/supervisor/research/p/review', 'PATCH'],
    [() => supervisor.updateResearchProgress('p', {}), '/supervisor/research/p/progress', 'PATCH'],
    [() => supervisor.manageMilestones('p', {}), '/supervisor/research/p/milestones', 'PATCH'],
    [() => supervisor.reviewDocument('d', { status: 'approved' }), '/supervisor/documents/d/review', 'PATCH'],
    [() => supervisor.addProjectFeedback('p', 'Feedback'), '/supervisor/research/p/feedback', 'POST'],
    [() => supervisor.scheduleMeeting({}), '/supervisor/meetings', 'POST'],
    [() => supervisor.updateMeeting('m', {}), '/supervisor/meetings/m', 'PATCH'],
    [() => supervisor.respondMeetingRequest('m', {}), '/supervisor/meetings/m/respond', 'PATCH'],
    [() => supervisor.getDeadlines(), '/supervisor/deadlines', 'GET'],
    [() => supervisor.createDeadline({}), '/supervisor/deadlines', 'POST'],
    [() => supervisor.deleteDeadline('d'), '/supervisor/deadlines/d', 'DELETE'],
    [() => supervisor.updateAvailabilitySchedule([]), '/supervisor/availability', 'PATCH'],
    [() => supervisor.updateSupervisorProfile({}), '/supervisor/profile', 'PATCH'],
    [() => supervisor.getProgressReports(), '/supervisor/reports', 'GET'],
    [() => supervisor.getSupervisorNotifications(), '/supervisor/notifications', 'GET'],
    [() => supervisor.markAllSupervisorNotificationsRead(), '/supervisor/notifications/read-all', 'PATCH'],
    [() => supervisor.markAllNotificationsAsRead(), '/supervisor/notifications/read-all', 'PATCH'],
    [() => supervisor.markNotificationAsRead('n'), '/supervisor/notifications/n/read', 'PATCH'],
  ];
  for (const [run, path, method] of cases) {
    await run();
    const [url, options] = fetch.mock.calls.at(-1).arguments;
    assert.equal(url, `/api${path}`);
    assert.equal(options.method || 'GET', method);
    assert.ok(options.headers.Authorization);
  }
});

test('showcase services encode filters and support pagination without authentication', async () => {
  const fetch = mock.method(globalThis, 'fetch', async () => Response.json({ research: [] }));
  await getPublicResearch({ query: 'AI & health', status: 'completed', page: 2 });
  const url = new URL(fetch.mock.calls.at(-1).arguments[0], 'http://localhost');
  assert.equal(url.searchParams.get('q'), 'AI & health');
  assert.equal(url.searchParams.get('page'), '2');
  await getPublicResearchDetails('project');
  assert.equal(fetch.mock.calls.at(-1).arguments[0], '/api/public/research/project');
  assert.equal(fetch.mock.calls.at(-1).arguments[1].headers.Authorization, undefined);
});

test('meeting and deadline payloads send unambiguous ISO dates', () => {
  const localDate = '2027-03-04T10:30';
  const data = JSON.parse(jsonBody({ meetingDate: localDate, dueDate: localDate, title: 'Meeting' }));
  assert.equal(data.meetingDate, new Date(localDate).toISOString());
  assert.equal(data.dueDate, new Date(localDate).toISOString());
  assert.equal(data.title, 'Meeting');
});
