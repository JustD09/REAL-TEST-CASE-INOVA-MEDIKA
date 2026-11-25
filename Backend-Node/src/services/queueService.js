// Queue Service

import { Worker, Queue } from 'bullmq';
import { v4 as uuidv4 } from 'uuid';
import { bullmqConnection } from '../config/redis.js';

const queues = {
  bpjs: new Queue('bpjs', { connection: bullmqConnection }),
  satusehat: new Queue('satusehat', { connection: bullmqConnection }),
  notification: new Queue('notification', { connection: bullmqConnection }),
  report: new Queue('report', { connection: bullmqConnection }),
};

const workers = [];

// BPJS - process SEP, Claim, Referral
const bpjsWorker = new Worker('bpjs', async (job) => {
  const { action, data } = job.data;
  console.info('[QUEUE] BPJS job', { action, jobId: job.id });

  switch (action) {
    case 'createSep':
      return processCreateSep(data);
    case 'createClaim':
      return processCreateClaim(data);
    case 'checkReferral':
      return processCheckReferral(data);
    default:
      throw new Error(`Unknown BPJS action: ${action}`);
  }
}, { connection: bullmqConnection, concurrency: 3 });

bpjsWorker.on('completed', (job) => console.info('[QUEUE] BPJS completed', job.id));
bpjsWorker.on('failed', (job, err) => console.error('[QUEUE] BPJS failed', job.id, err.message));
workers.push(bpjsWorker);

// SATUSEHAT - push Patient, Encounter, Observation
const satusehatWorker = new Worker('satusehat', async (job) => {
  const { action, data } = job.data;
  console.info('[QUEUE] SATUSEHAT job', { action, jobId: job.id });

  switch (action) {
    case 'pushPatient':
      return processPushPatient(data);
    case 'pushEncounter':
      return processPushEncounter(data);
    case 'pushObservation':
      return processPushObservation(data);
    default:
      throw new Error(`Unknown SATUSEHAT action: ${action}`);
  }
}, { connection: bullmqConnection, concurrency: 2 });

satusehatWorker.on('completed', (job) => console.info('[QUEUE] SATUSEHAT completed', job.id));
satusehatWorker.on('failed', (job, err) => console.error('[QUEUE] SATUSEHAT failed', job.id, err.message));
workers.push(satusehatWorker);

// Notification - email, WhatsApp, push
const notificationWorker = new Worker('notification', async (job) => {
  const { type, recipient, subject } = job.data;
  console.info('[QUEUE] Notification job', { type, recipient, jobId: job.id });

  // TODO: Implement actual notification providers (email, WA, FCM)
  console.log(`[NOTIFICATION] ${type} to ${recipient}: ${subject}`);
  return { sent: true, timestamp: new Date().toISOString() };
}, { connection: bullmqConnection, concurrency: 5 });

notificationWorker.on('completed', (job) => console.info('[QUEUE] Notification completed', job.id));
notificationWorker.on('failed', (job, err) => console.error('[QUEUE] Notification failed', job.id, err.message));
workers.push(notificationWorker);

// Report - generate PDF, Excel reports
const reportWorker = new Worker('report', async (job) => {
  const { reportType, requestedBy } = job.data;
  console.info('[QUEUE] Report job', { reportType, jobId: job.id });

  // TODO: Implement report generation
  console.log(`[REPORT] Generating ${reportType} for user ${requestedBy}`);
  return { reportType, status: 'generated', url: `/reports/${reportType}-${uuidv4()}.pdf` };
}, { connection: bullmqConnection, concurrency: 2 });

reportWorker.on('completed', (job) => console.info('[QUEUE] Report completed', job.id));
reportWorker.on('failed', (job, err) => console.error('[QUEUE] Report failed', job.id, err.message));
workers.push(reportWorker);

// Penambahan job helpers
export async function addBpjsJob(action, data) {
  return queues.bpjs.add(action, { action, data }, { attempts: 3, backoff: { type: 'exponential', delay: 5000 } });
}

export async function addSatusehatJob(action, data) {
  return queues.satusehat.add(action, { action, data }, { attempts: 3, backoff: { type: 'exponential', delay: 5000 } });
}

export async function addNotificationJob(type, recipient, subject, message, data = {}) {
  return queues.notification.add('send', {
    type, recipient, subject, message, data,
  }, { attempts: 2 });
}

export async function addReportJob(reportType, params, requestedBy) {
  return queues.report.add('generate', { reportType, params, requestedBy }, { attempts: 1 });
}

// Implement BPJS SEP creation
async function processCreateSep(_data) {
  return { success: true, message: 'SEP created via queue' };
}

// Implement BPJS Claim
async function processCreateClaim(_data) {
  return { success: true, message: 'Claim created via queue' };
}

// Implement BPJS Referral check
async function processCheckReferral(_data) {
  return { success: true, message: 'Referral checked via queue' };
}

// Implement SATUSEHAT Patient push
async function processPushPatient(_data) {
  return { success: true, message: 'Patient pushed via queue' };
}

// Implement SATUSEHAT Encounter push
async function processPushEncounter(_data) {
  return { success: true, message: 'Encounter pushed via queue' };
}

// Implement SATUSEHAT Observation push
async function processPushObservation(_data) {
  return { success: true, message: 'Observation pushed via queue' };
}

// Matikan semua queue
export async function closeQueues() {
  for (const worker of workers) {
    await worker.close();
  }
  for (const q of Object.values(queues)) {
    await q.close();
  }
  console.info('[QUEUE] All queues closed');
}

export default {
  queues,
  addBpjsJob,
  addSatusehatJob,
  addNotificationJob,
  addReportJob,
  closeQueues,
};
