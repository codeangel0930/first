import { AppID, RecordID, Revision } from "./../KintoneTypes";
import { HttpClient } from "./../http/";

type Record = {
  [fieldCode: string]: any;
};

type Mention = {
  code: string;
  type: "USER" | "GROUP" | "ORGANIZATION";
};

type Comment = {
  id: number;
  text: string;
  createdAt: string;
  creator: {
    code: string;
    name: string;
  };
  mentions: Mention[];
};

type CommentID = string | number;

export class RecordClient {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }

  public getRecord<T extends Record>(params: {
    app: AppID;
    id: RecordID;
  }): Promise<{ record: T }> {
    const path = "/k/v1/record.json";
    return this.client.get(path, params);
  }

  public addRecord(params: {
    app: AppID;
    record?: object;
  }): Promise<{ id: RecordID; revision: Revision }> {
    const path = "/k/v1/record.json";
    return this.client.post(path, params);
  }

  public updateRecord(
    params:
      | { app: AppID; id: RecordID; record?: object; revision?: Revision }
      | { app: AppID; updateKey: object; record?: object; revision?: Revision }
  ): Promise<{ revision: Revision }> {
    const path = "/k/v1/record.json";
    return this.client.put(path, params);
  }

  // TODO: `records` type in return type should be filtered by `fields`.
  public getRecords<T extends Record>(params: {
    app: AppID;
    fields?: string[];
    query?: string;
    totalCount?: boolean;
  }): Promise<{ records: T[]; totalCount: string | null }> {
    const path = "/k/v1/records.json";
    return this.client.get(path, params);
  }

  public addRecords(params: {
    app: AppID;
    records: Record[];
  }): Promise<{ ids: string[]; revisions: string[] }> {
    const path = "/k/v1/records.json";
    return this.client.post(path, params);
  }

  public updateRecords(params: {
    app: AppID;
    records: Array<
      | { id: RecordID; record?: object; revision?: Revision }
      | { updateKey: object; record?: object; revision?: Revision }
    >;
  }): Promise<Array<{ id: string; revision: string }>> {
    const path = "/k/v1/records.json";
    return this.client.put(path, params);
  }

  public deleteRecords(params: {
    app: AppID;
    ids: RecordID[];
    revisions?: Revision[];
  }): Promise<{}> {
    const path = "/k/v1/records.json";
    return this.client.delete(path, params);
  }

  public createCursor(params: {
    app: AppID;
    fields?: string[];
    query?: string;
    size?: number | string;
  }): Promise<{ id: string; totalCount: string }> {
    const path = "/k/v1/records/cursor.json";
    return this.client.post(path, params);
  }

  public getRecordsByCursor<T extends Record>(params: {
    id: string;
  }): Promise<{
    records: T[];
    next: boolean;
  }> {
    const path = "/k/v1/records/cursor.json";
    return this.client.get(path, params);
  }

  public deleteCursor(params: { id: string }): Promise<{}> {
    const path = "/k/v1/records/cursor.json";
    return this.client.delete(path, params);
  }

  public async getAllRecordsWithCursor<T extends Record>(params: {
    app: AppID;
    fields?: string[];
    query?: string;
  }): Promise<{ records: T[]; totalCount: string }> {
    const { id, totalCount } = await this.createCursor(params);
    try {
      const allRecords = await this.getAllRecordsRecursiveByCursor<T>(id, []);
      return { records: allRecords, totalCount };
    } catch (error) {
      this.deleteCursor({ id });
      throw error;
    }
  }

  private async getAllRecordsRecursiveByCursor<T extends Record>(
    id: string,
    records: T[]
  ): Promise<T[]> {
    const result = await this.getRecordsByCursor<T>({ id });
    const allRecords = records.concat(result.records);
    if (result.next) {
      return this.getAllRecordsRecursiveByCursor(id, allRecords);
    }
    return allRecords;
  }

  public addComment(params: {
    app: AppID;
    record: RecordID;
    comment: {
      text: string;
      mentions?: Mention[];
    };
  }): Promise<{ id: string }> {
    const path = "/k/v1/record/comment.json";
    return this.client.post(path, params);
  }

  public deleteComment(params: {
    app: AppID;
    record: RecordID;
    comment: CommentID;
  }): Promise<{}> {
    const path = "/k/v1/record/comment.json";
    return this.client.delete(path, params);
  }

  public getComments(params: {
    app: AppID;
    record: RecordID;
    order?: "asc" | "desc";
    offset?: number;
    limit?: number;
  }): Promise<{ comments: Comment[]; older: boolean; newer: boolean }> {
    const path = "/k/v1/record/comments.json";
    return this.client.get(path, params);
  }

  public updateAssignees(params: {
    app: AppID;
    id: RecordID;
    assignees: string[];
    revision?: Revision;
  }): Promise<{ revision: string }> {
    const path = "/k/v1/record/assignees.json";
    return this.client.put(path, params);
  }

  public updateStatus(params: {
    action: string;
    app: AppID;
    assignee?: string;
    id: RecordID;
    revision?: Revision;
  }): Promise<{ revision: string }> {
    const path = "/k/v1/record/status.json";
    return this.client.put(path, params);
  }

  public updateStatuses(params: {
    app: AppID;
    records: Array<{
      action: string;
      assignee?: string;
      id: RecordID;
      revision?: Revision;
    }>;
  }): Promise<{ records: Array<{ id: string; revision: string }> }> {
    const path = "/k/v1/records/status.json";
    return this.client.put(path, params);
  }
}
