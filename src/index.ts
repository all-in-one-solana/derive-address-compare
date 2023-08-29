const Web3 = require('@solana/web3.js');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { Keypair, PublicKey, SystemProgram, Transaction, sendAndConfirmTransaction, TransactionInstruction } = Web3;

async function main() {
  // 连接到Solana集群（这里使用devnet）
  const connection = new Web3.Connection("http://localhost:8899", 'confirmed');

  // 创建或获取用户的主密钥对
  // 这里只是生成了一个新的密钥对作为示例
  const homeDir = os.homedir();
  const configFilePath = path.join(homeDir, '.config', 'solana', 'id.json');
  const privateKey = fs.readFileSync(configFilePath, 'utf-8');
  const baseAccount = Web3.Keypair.fromSecretKey(new Uint8Array(JSON.parse(privateKey)));
  console.log(`Base Public Key: ${baseAccount.publicKey.toString()}`);

  // 定义种子和程序ID（这里使用SystemProgram的ID作为示例）
  const seed = 'saving';
  const programId = SystemProgram.programId;

  // 创建派生公钥
  const derivedPublicKey = await PublicKey.createWithSeed(
    baseAccount.publicKey,
    seed,
    programId,
  );
  console.log(`Derived Public Key: ${derivedPublicKey.toString()}`);

  // // 创建一个交易以初始化派生账户
  // const transaction = new Transaction().add(
  //   SystemProgram.createAccountWithSeed({
  //     fromPubkey: baseAccount.publicKey,
  //     basePubkey: baseAccount.publicKey,
  //     seed: seed,
  //     newAccountPubkey: derivedPublicKey,
  //     lamports: 1000000, // 为派生账户预留的初始资金
  //     space: 0, // 分配给这个账户的空间大小（以字节为单位）
  //     programId: programId,
  //   }),
  // );

  // // 签署交易
  // transaction.recentBlockhash = (await connection.getRecentBlockhash()).blockhash;
  // transaction.sign(baseAccount);

  // // 发送并确认交易
  // const txid = await sendAndConfirmTransaction(connection, transaction, [baseAccount]);
  // console.log(`Transaction: https://explorer.solana.com/tx/${txid}/?cluster=custom`);

  // 验证派生账户是否存在
  const derivedAccountInfo = await connection.getAccountInfo(derivedPublicKey);
  if (derivedAccountInfo === null) {
    console.log('Failed to create derived account');
  } else {
    console.log('Successfully created and initialized derived account');
  }

  // 创建一个交易以向派生账户转账
  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: baseAccount.publicKey,
      toPubkey: derivedPublicKey,
      // fromPubkey: derivedPublicKey,
      // toPubkey: baseAccount.publicKey,
      lamports: 10 * 1000_000_000, // 转账金额
    }),
  );

  // 签署交易
  transaction.recentBlockhash = (await connection.getRecentBlockhash()).blockhash;
  transaction.sign(baseAccount);

  // 发送并确认交易
  const txid = await sendAndConfirmTransaction(connection, transaction, [baseAccount]);
  console.log(`Transaction: https://explorer.solana.com/tx/${txid}/?cluster=custom`);

  // 验证派生账户的余额
  const derivedAccountBalance = await connection.getBalance(derivedPublicKey);
  console.log(`Derived account balance: ${derivedAccountBalance / 1000_000_000}`);

  // 创建一个交易以向派生账户转账
  const newtransaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: derivedPublicKey,
      basePubkey: baseAccount.publicKey,
      toPubkey: baseAccount.publicKey,
      lamports: 10 * Web3.LAMPORTS_PER_SOL, // 转账金额
      seed: seed,
      programId: programId,
    }),
  );

  // 签署交易
  newtransaction.recentBlockhash = (await connection.getRecentBlockhash()).blockhash;
  newtransaction.sign(baseAccount);

  // 发送并确认交易
  const newtxid = await sendAndConfirmTransaction(connection, newtransaction, [baseAccount]);
  console.log(`Transaction: https://explorer.solana.com/tx/${newtxid}/?cluster=custom`);

  // 验证派生账户的余额
  const newderivedAccountBalance = await connection.getBalance(derivedPublicKey);
  console.log(`Derived account balance: ${newderivedAccountBalance / 1000_000_000}`);
}

main()
  .then(() => {
    console.log("Finished successfully")
    process.exit(0)
  })
  .catch((error) => {
    console.log(error)
    process.exit(1)
  })
