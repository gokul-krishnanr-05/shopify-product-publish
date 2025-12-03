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

//fetching locations for quantity update
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
//create new product to the store
app.post('/api/create-product', async (req,res)=>{
    const {productInput}=req.body
const mutation = `
mutation productSet($synchronous: Boolean!, $input: ProductSetInput!) {
  productSet(synchronous: $synchronous, input: $input) {
    product {
      id
      title
      status:"DRAFT"
      handle
      totalVariants
      variants(first: 10) {
        nodes {
          id
          title
          sku
        }
      }
    }
    userErrors {
      field
      message
    }
  }
}
`;
try{
    const response= await axios.post(SHOPIFY_API_URL,{query:mutation,variables:{
        synchronous:true,input:productInput
    }},
    {headers:HEADERS}
);
if (response.data.errors) {
      console.error("GRAPHQL ERROR:", response.data.errors);
      return res.status(400).json({ success: false, errors: response.data.errors });
    }

    // ERROR CHECK 2: Data structure missing
    if (!response.data.data || !response.data.data.productSet) {
      return res.status(500).json({ success: false, error: "Shopify returned valid JSON but missing productSet data." });
    }
    const result = response.data.data.productSet;

    // ERROR CHECK 3: User Errors (Logic errors, e.g., SKU taken)
    if (result.userErrors && result.userErrors.length > 0) {
      return res.status(400).json({ success: false, errors: result.userErrors });
    }
    res.json({ success: true, product: result.product });
}
catch (error) {
    console.error("Network/Server Error:", error.response ? error.response.data : error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(process.env.PORT || 5000, () => {
  console.log(`Server running on port ${process.env.PORT || 5000}`);
});

