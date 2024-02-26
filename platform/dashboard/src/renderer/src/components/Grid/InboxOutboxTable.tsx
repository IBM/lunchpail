import GridRow from "./Row"

type Props = { rowLabelPrefix: string; inbox: number[]; processing: number[]; outbox?: number[] }

/**
 * This is a special case that uses table of `<GridRow/>` with one row
 * per worker or workerpool, etc.; and, within each row, one cell per
 * inbox, processing, or outbox task.
 */
export default function InboxOutboxTable(props: Props) {
  const nRows = Math.max(props.inbox.length, props.processing.length, props.outbox?.length ?? 0)

  return (
    <div className="codeflare--workqueues">
      {Array(nRows)
        .fill(0)
        .map((_, idx) => (
          <GridRow
            key={idx}
            label={props.rowLabelPrefix + (idx + 1)}
            count1={props.inbox[idx] ?? 0}
            kind1="pending"
            count2={props.processing[idx] ?? 0}
            kind2="running"
            count3={!props.outbox ? undefined : props.outbox[idx] ?? 0}
            kind3="completed"
          />
        ))}
    </div>
  )
}
