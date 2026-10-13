import dayjs, { type Dayjs } from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"

dayjs.extend(relativeTime)

export type { Dayjs }
export default dayjs
