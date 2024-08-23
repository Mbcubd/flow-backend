import * as client from "../src/mod.ts";
import { Value, web3, bs58 } from "../src/deps.ts";
import { Keypair } from "npm:@solana/web3.js@^1.91.4";
import * as dotenv from "jsr:@std/dotenv";

dotenv.loadSync({
  export: true,
});

const c = new client.Client({
  host: "http://localhost:8080",
});

function keypair_from_env() {
  const value = Deno.env.get("TEST_KEYPAIR");
  if (!value) return undefined;
  return Keypair.fromSecretKey(bs58.decodeBase58(value));
}

const keypair = keypair_from_env() ?? web3.Keypair.generate();

const connection = new web3.Connection("https://api.devnet.solana.com");
if ((await connection.getBalance(keypair.publicKey)) == 0) {
  await connection.requestAirdrop(keypair.publicKey, web3.LAMPORTS_PER_SOL);
  while ((await connection.getBalance(keypair.publicKey)) == 0) {}
}

const result = await c.startFlowUnverified(2154, keypair.publicKey, {
  inputs: new Value({
    sender: keypair.publicKey,
  }).M!,
  fees: [["HuktZqYAXSeMz5hMtdEnvsJAXtapg24zXU2tkDnGgaSZ", 1000]],
});

const req = await c.getSignatureRequest(result.flow_run_id, result.token);

const tx = req.buildTransaction();

tx.sign(keypair);

const sigResult = await c.submitSignature({
  id: req.id,
  signature: bs58.encodeBase58(tx.signature!),
});

console.log(sigResult);

const output = await c.getFlowOutput(result.flow_run_id, result.token);

console.log(output);