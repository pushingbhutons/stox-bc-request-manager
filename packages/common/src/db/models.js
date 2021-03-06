const uuid = require('uuid4')
const {DataTypes} = require('sequelize')

const {STRING, DATE, JSON, UUID, INTEGER, BLOB, BIGINT} = DataTypes
const ADDRESS = STRING(42)
const TRANSACTION_HASH = STRING(66)
const NETWORK = STRING(256)

const indexes = specs => specs.map(spec => (typeof spec === 'string' ? {fields: [spec]} : spec))
const oneOf = values => ({
  type: STRING(256),
  validate: {isIn: [values]},
  allowNull: false,
})

module.exports = (sequelize) => {
  const Request = sequelize.define(
    'requests',
    {
      id: {type: UUID, primaryKey: true},
      type: oneOf(['sendPrize', 'withdraw', 'setWithdrawalAddress', 'sendToBackup', 'createWallet']),
      priority: {type: STRING(256)},
      error: {type: JSON},
      data: {type: JSON},
      result: {type: JSON},
      createdAt: {type: DATE, allowNull: false},
      sentAt: {type: DATE},
      completedAt: {type: DATE},
      transactionPreparedAt: {type: DATE},
    },
    {
      indexes: indexes(['id', 'type', 'createdAt', 'completedAt', 'sentAt']),
    }
  )

  const Transaction = sequelize.define(
    'transactions',
    {
      id: {type: UUID, primaryKey: true, defaultValue: () => uuid()},
      requestId: {type: UUID, allowNull: false, references: {model: 'requests', key: 'id'}},
      type: oneOf(['send', 'deploy']),
      subRequestIndex: {type: INTEGER, defaultValue: 0},
      subRequestData: {type: JSON},
      subRequestType: {type: STRING(256)},
      originalTransactionId: {type: UUID},
      transactionHash: {type: TRANSACTION_HASH},
      transactionData: {type: BLOB}, // ?
      network: {type: NETWORK, allowNull: false},
      from: {type: ADDRESS},
      to: {type: ADDRESS},
      currentBlockTime: {type: DATE},
      blockNumber: {type: BIGINT},
      nonce: {type: BIGINT}, // ?
      gasPrice: {type: BIGINT}, // ?
      receipt: {type: JSON}, // ?
      createdAt: {type: DATE, allowNull: false},
      sentAt: {type: DATE},
      resentAt: {type: DATE},
      canceledAt: {type: DATE},
      error: {type: JSON},
      completedAt: {type: DATE},
      estimatedGas: {type: BIGINT},
      estimatedGasCost: {type: BIGINT},
      gasUsed: {type: BIGINT},
    },
    {
      indexes: indexes(['requestId', 'type', 'transactionHash', 'createdAt', 'completedAt', 'sentAt', 'from', 'to']),
    }
  )
  Transaction.belongsTo(Request)
  Request.hasMany(Transaction)

  sequelize.define(
    'accountNonces',
    {
      account: {type: ADDRESS, primaryKey: true},
      network: {type: NETWORK, primaryKey: true},
      createdAt: {type: DATE, allowNull: false},
      nonce: {type: BIGINT},
    },
    {
      indexes: indexes(['address', 'network', 'nonce', 'updatedAt']),
    }
  )

  const GasPercentile = sequelize.define(
    'gasPercentiles',
    {
      priority: {type: STRING(256), primaryKey: true, unique: true},
      percentile: {type: INTEGER, allowNull: false},
      price: {type: BIGINT, allowNull: false},
      network: {type: NETWORK, allowNull: false},
      createdAt: {type: DATE, allowNull: false},
      updatedAt: {type: DATE, allowNull: false},
    }
  )
  Request.belongsTo(GasPercentile, {foreignKey: 'priority'})

  return sequelize
}
