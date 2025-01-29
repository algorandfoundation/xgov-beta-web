export const schema = {
  "title": "xGov Commitee",
  "description": "Selected xGov Committee with voting power and validity",
  "type": "object",
  "properties": {
      "xGovs": {
          "description": "xGovs with voting power, sorted lexicographically with respect addresses",
          "type": "array",
          "items": {
              "type": "object",
              "properties": {
                  "address": {
                      "description": "xGov address used on xGov Registry",
                      "type": "string"
                  },
                  "votes": {
                      "description": "xGov voting power",
                      "type": "number"
                  }
              }
          },
          "uniqueItems": true,
          "required": [
              "address",
              "votes"
          ]
      },
      "periodStart": {
          "description": "First block of the Committee slection period (equal or greater than)",
          "type": "number"
      },
      "periodEnd": {
          "description": "Last block of the Committee slection period (less than)",
          "type": "number"
      },
      "members": {
          "description": "Total number of Committee members",
          "type": "number"
      },
      "votes": {
          "description": "Total number of Committee votes",
          "type": "number"
      }
  },
  "required": [
      "xGovs",
      "periodStart",
      "periodEnd",
      "members",
      "votes"
  ],
"additionalProperties": false
}

export interface XGov {
  /**
   * xGov address used in xGov Registry
   */
  address: string;
  /**
   * xGov voting power
   */
  votes: number;
}
export interface CommitteeCohort {
  /**
   * xGovs with voting power, sorted lexicographically with respect addresses
   */
  xGovs: XGov[];
  /**
   * First block of the Committee selection period (equal or greater than)
   */
  periodStart: number;
  /**
   * Last block of the Committee selection period (less than)
   */
  periodEnd: number;
  /**
   * Total number of Committee members
   */
  members: number;
  /**
   * Total number of Committee votes
   */
  votes: number;
}