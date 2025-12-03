require("dotenv").config()
const express = require('express');
const cors = require("cors");
const axios = require("axios");


const app = express()
app.use(cors())
app.use(express.json({limit:'50mb'}))
console.log(process.env.SHOPIFY_NAME)

const SHOPIFY_API_URL=`https://${process.env.SHOPIFY_NAME}/admin/api/2024-04/graphql.json`;
const HEADERS = {
    'Content-Type':'application/json',
    'X-Shopify-Access-Token':process.env.SHOPIFY_ACCESS_TOKEN
}
app.get ('/api/location', async (req,res)=>{
    const query=`{
    locations(first:10){
        edges{
            node{
                id
                name
            }
        }
    }
}
    `;
try{
const response=await axios.post(SHOPIFY_API_URL,{query},{headers:HEADERS});
if (response.data.errors){
    throw new Error(JSON.stringify(response.data.errors));7
}
res.json(response.data.data.locations.edges.map(edge=>edge.node));

}
catch(error){
    console.error("Error in fetching the locations : ",error.message)
    res.status(500).json({error :error.message})
}
}
)


app.listen(process.env.PORT || 5000, () => {
  console.log(`Server running on port ${process.env.PORT || 5000}`);
});

