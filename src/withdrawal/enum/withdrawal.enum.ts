export enum WithdrawalStatus {
  pending = 'pending',
  success = 'success',
  failed = 'failed',
  review = 'in-review',
}

export enum WithdrawalMethod {
  paypal = 'paypal',
  bankTransfer = 'bank-transfer',
}

export enum WithdrawalApprovalStatus {
  pending = 'pending',
  approved = 'approved',
  rejected = 'rejected',
  review = 'in-review',
}
