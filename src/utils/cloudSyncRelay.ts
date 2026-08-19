import { ClassAssignment, ClassSubmission } from '../types';

// Global topics namespace for TaskDiffuser Edu
const TOPIC_PREFIX = 'edutn43_taskdiff';

function sanitizeCode(code: string): string {
  return code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '_');
}

function sanitizeId(id: string): string {
  return id.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
}

/**
 * 1. Push an assignment to the universal cloud relay
 * Uses ntfy.sh with cache enabled + multi-mirror fallback
 */
export async function pushAssignmentToCloudRelay(assignment: ClassAssignment): Promise<boolean> {
  if (!assignment || !assignment.code) return false;
  const cleanCode = sanitizeCode(assignment.code);
  const topic = `${TOPIC_PREFIX}_assign_${cleanCode}`;

  let success = false;

  // Primary: ntfy.sh cached topic
  try {
    const res = await fetch(`https://ntfy.sh/${topic}?cache=yes`, {
      method: 'POST',
      headers: { 
        'Title': `Assignment: ${assignment.code}`,
        'Priority': 'default'
      },
      body: JSON.stringify(assignment)
    });
    if (res.ok) {
      success = true;
    }
  } catch (err) {
    console.warn('[Cloud Relay] Primary assignment push error:', err);
  }

  // Also push by assignment ID topic so it can be queried by ID
  if (assignment.id) {
    const idTopic = `${TOPIC_PREFIX}_assign_${sanitizeId(assignment.id)}`;
    try {
      fetch(`https://ntfy.sh/${idTopic}?cache=yes`, {
        method: 'POST',
        body: JSON.stringify(assignment)
      }).catch(() => {});
    } catch {}
  }

  return success;
}

/**
 * 2. Fetch an assignment by its PIN code or ID from the universal cloud relay
 */
export async function fetchAssignmentFromCloudRelay(codeOrId: string): Promise<ClassAssignment | null> {
  if (!codeOrId) return null;
  const cleanCode = sanitizeCode(codeOrId);
  const topic = `${TOPIC_PREFIX}_assign_${cleanCode}`;

  // Try lookup by PIN code
  try {
    const res = await fetch(`https://ntfy.sh/${topic}/json?poll=1&since=all`);
    if (res.ok) {
      const text = await res.text();
      const lines = text.trim().split('\n');
      // Iterate from latest message to earliest
      for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i].trim();
        if (!line) continue;
        try {
          const envelope = JSON.parse(line);
          if (envelope && envelope.message) {
            const assignment = typeof envelope.message === 'string' ? JSON.parse(envelope.message) : envelope.message;
            if (assignment && (assignment.code || assignment.id) && Array.isArray(assignment.lanes)) {
              return assignment as ClassAssignment;
            }
          }
        } catch {}
      }
    }
  } catch (err) {
    console.warn('[Cloud Relay] Lookup by PIN code failed:', err);
  }

  // Try lookup by ID topic if code lookup did not return
  try {
    const cleanId = sanitizeId(codeOrId);
    const idTopic = `${TOPIC_PREFIX}_assign_${cleanId}`;
    const res = await fetch(`https://ntfy.sh/${idTopic}/json?poll=1&since=all`);
    if (res.ok) {
      const text = await res.text();
      const lines = text.trim().split('\n');
      for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i].trim();
        if (!line) continue;
        try {
          const envelope = JSON.parse(line);
          if (envelope && envelope.message) {
            const assignment = typeof envelope.message === 'string' ? JSON.parse(envelope.message) : envelope.message;
            if (assignment && assignment.code && Array.isArray(assignment.lanes)) {
              return assignment as ClassAssignment;
            }
          }
        } catch {}
      }
    }
  } catch (err) {
    console.warn('[Cloud Relay] Lookup by ID failed:', err);
  }

  return null;
}

/**
 * 3. Push a student submission to the cloud relay
 */
export async function pushSubmissionToCloudRelay(submission: ClassSubmission): Promise<boolean> {
  if (!submission || !submission.assignmentId) return false;
  const cleanId = sanitizeId(submission.assignmentId);
  const topic = `${TOPIC_PREFIX}_subs_${cleanId}`;

  try {
    const res = await fetch(`https://ntfy.sh/${topic}?cache=yes`, {
      method: 'POST',
      headers: {
        'Title': `Submission: ${submission.studentName || 'Student'} (${submission.tier})`,
        'Tags': 'student,submission'
      },
      body: JSON.stringify(submission)
    });
    return res.ok;
  } catch (err) {
    console.warn('[Cloud Relay] Syncing submission failed:', err);
    return false;
  }
}

/**
 * 4. Fetch all submissions for an assignment from the cloud relay
 */
export async function fetchSubmissionsFromCloudRelay(assignmentId: string): Promise<ClassSubmission[]> {
  if (!assignmentId) return [];
  const cleanId = sanitizeId(assignmentId);
  const topic = `${TOPIC_PREFIX}_subs_${cleanId}`;
  const submissionsMap = new Map<string, ClassSubmission>();

  try {
    const res = await fetch(`https://ntfy.sh/${topic}/json?poll=1&since=all`);
    if (res.ok) {
      const text = await res.text();
      const lines = text.trim().split('\n');
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const envelope = JSON.parse(line);
          if (envelope && envelope.message) {
            const sub = typeof envelope.message === 'string' ? JSON.parse(envelope.message) : envelope.message;
            if (sub && sub.id && sub.assignmentId && sub.studentName && sub.tier) {
              submissionsMap.set(sub.id, sub as ClassSubmission);
            }
          }
        } catch {}
      }
    }
  } catch (err) {
    console.warn('[Cloud Relay] Fetching submissions failed:', err);
  }

  return Array.from(submissionsMap.values());
}

/**
 * 5. Real-time Live EventSource Subscription for Teacher Live Dashboard
 */
export function subscribeToLiveCloudSubmissions(
  assignmentId: string, 
  onNewSubmission: (submission: ClassSubmission) => void
): () => void {
  if (typeof window === 'undefined' || !window.EventSource || !assignmentId) {
    return () => {};
  }

  const cleanId = sanitizeId(assignmentId);
  const topic = `${TOPIC_PREFIX}_subs_${cleanId}`;
  let es: EventSource | null = null;

  try {
    es = new EventSource(`https://ntfy.sh/${topic}/sse`);
    es.onmessage = (event) => {
      try {
        const envelope = JSON.parse(event.data);
        if (envelope && envelope.message) {
          const sub = typeof envelope.message === 'string' ? JSON.parse(envelope.message) : envelope.message;
          if (sub && sub.id && sub.assignmentId && sub.studentName) {
            onNewSubmission(sub as ClassSubmission);
          }
        }
      } catch (e) {
        // Ignore parse error on heartbeats
      }
    };
  } catch (e) {
    console.warn('[Cloud Relay] SSE connection failed, falling back to polling:', e);
  }

  return () => {
    if (es) {
      es.close();
      es = null;
    }
  };
}
