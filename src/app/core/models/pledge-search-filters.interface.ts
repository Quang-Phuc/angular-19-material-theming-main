// src/app/core/models/pledge-search-filters.interface.ts
export interface PledgeSearchFilters {
  keyword?: string;
  loanStatus?: string;
  pledgeStatus?: string;
  storeId?: string;
  fromDate?: string;
  toDate?: string;
  follower?: string;
}
