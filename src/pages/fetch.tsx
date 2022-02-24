import { useState } from 'react';
import { useWallet } from "@solana/wallet-adapter-react";
import * as anchor from "@project-serum/anchor";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { programs } from '@metaplex/js'
import {
  Connection,
  PublicKey,
  ConfirmOptions,
} from "@solana/web3.js";
import axios from "axios"

let conn = new Connection('https://broken-sparkling-butterfly.solana-mainnet.quiknode.pro/682b281516b2676b74848a5a32618fff20576706/')
const { metadata: { Metadata } } = programs

const CANDY_MACHINE_PROGRAM = new anchor.web3.PublicKey("cndy3Z4yapfJBmL3ShUp5exZKqR3z33thTzeNMm2gRZ");

const TOKEN_METADATA_PROGRAM_ID = new anchor.web3.PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s")
const confirmOption : ConfirmOptions = { commitment : 'finalized', preflightCommitment : 'finalized', skipPreflight : false }

const MAX_NAME_LENGTH = 32;
const MAX_URI_LENGTH = 200;
const MAX_SYMBOL_LENGTH = 10;
const MAX_CREATOR_LEN = 32 + 1 + 1;

const getCandyMachineCreator = async (
  candyMachine: anchor.web3.PublicKey,
): Promise<[anchor.web3.PublicKey, number]> => {
  return await anchor.web3.PublicKey.findProgramAddress(
    [Buffer.from('candy_machine'), candyMachine.toBuffer()],
    CANDY_MACHINE_PROGRAM,
  );
};

export default function Fetch(){
	const wallet = useWallet()
  const [nfts, setNFTs] = useState<any>([])
  const [candy_machine_id, setCandyMachineId] = useState<string>("")

  async function getNfts(){
    console.log("+ getNFTs")
    let amount = 5;
    const allTokens: any = []
    const [candyMachineCreator, creatorBump] = await getCandyMachineCreator(
      new PublicKey(candy_machine_id),
    );
    console.log(candyMachineCreator.toBase58())
    const metadataAccounts = await conn.getProgramAccounts(
      TOKEN_METADATA_PROGRAM_ID,
      {
        filters: [
          {
            memcmp: {
              offset:
                1 +
                32 +
                32 +
                4 +
                MAX_NAME_LENGTH +
                4 +
                MAX_URI_LENGTH +
                4 +
                MAX_SYMBOL_LENGTH +
                2 +
                1 +
                4 +
                0 * MAX_CREATOR_LEN,
              bytes: candyMachineCreator.toBase58(),
            },
          },
        ],
      }
    );
    
    const mintHashes = [];
    
    for (let index = 0; index < metadataAccounts.length; index++) {
      try{
        const account = metadataAccounts[index];
        const accountInfo = await conn.getParsedAccountInfo(account.pubkey);
        // @ts-ignore
        const metadata =new Metadata(candyMachineCreator.toString(), accountInfo.value);
        let { data }: any = await axios.get(metadata.data.data.uri)
        console.log(data)
        if(nfts.length > 0)
          setNFTs([...nfts, data])
        else setNFTs([data])   
        amount ++;
      } catch(e) {
      }
    }
    console.log(allTokens)
    return allTokens
  }
	return(
    <div className="container-fluid mt-4">        
      <div className="row">
        <div className='mb-3'>
          <input type='text' value={candy_machine_id} placeholder="CMID" onChange={(e) => setCandyMachineId(e.target.value)} />
          <button type="button" className="btn btn-warning m-1" onClick={async () =>{ await getNfts()	}}>Get NFTs</button>
        </div>
        <div className="row">
          <div className='col-12'>
            <br />
            <div className="row">
              {
                nfts.map((nft: any, idx: number)=>{
                  return <div className="card m-3" key={idx} style={{"width" : "250px"}}>
                    <img className="card-img-top" src={nft.image} alt="Image Error"/>
                    <p>{nft.name}</p>
                    <p>{nft.symbol}</p>
                    <p>{nft.seller_fee_basis_points}</p>
                    <p>{nft.exernal_url}</p>
                  </div>
                })
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  ) 
}