export enum CodeStatus {
  ADDED = "added",
  DELETED = "deleted",
  EQUAL = "equal",
  UPDATED = "updated",
}

export type CodeTokenDiff = {
  value: string;
  previousValue?: string;
  status: `${CodeStatus}`;
};

export type CodeLineDiff = {
  value: string;
  previousValue?: string;
  line: number | null;
  previousLine: number | null;
  status: `${CodeStatus}`;
  diff?: CodeTokenDiff[];
};

export type CodeDiff = {
  type: "code";
  status: `${CodeStatus}`;
  diff: CodeLineDiff[];
};
