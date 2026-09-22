import { buildSourceAnnotations } from './sourceAnnotations.js';

const REVISION_STATUSES = new Set(['NEEDS_EVIDENCE', 'VIOLATION']);

export function createWriterHandoff(validationResult = {}, originalListing = '') {
  const segments = validationResult.segment_results || [];
  const rangeBySegment = new Map(buildSourceAnnotations(originalListing, segments).map((range) => [range.segment, range]));
  const revisionTasks = segments
    .filter((segment) => REVISION_STATUSES.has(segment.status))
    .map((segment) => {
      const range = rangeBySegment.get(segment);
      return {
        section: segment.section,
        index: segment.index,
        sentence_id: segment.sentence_id || `${segment.section}:${segment.index}`,
        source_text: segment.source_text,
        policy_ids: (segment.matched_policies || []).map((policy) => policy.rule_id).filter(Boolean),
        required_action: segment.reason,
        validation_status: segment.status,
        ...(range && { source_start: range.start, source_end: range.end }),
      };
    });

  return {
    target_agent: 'amazon-listing-writer',
    status: 'WRITER_PENDING',
    trace_id: validationResult.trace_id || null,
    created_at: new Date().toISOString(),
    original_listing: originalListing,
    revision_tasks: revisionTasks,
  };
}

export function saveWriterHandoff(payload, storage = globalThis.localStorage) {
  storage.setItem('comply.writerHandoff', JSON.stringify(payload));
  return payload;
}

