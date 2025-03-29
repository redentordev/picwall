import type { NextApiRequest, NextApiResponse } from 'next'
 
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    POST(req, res)
  } else if (req.method === 'GET') {
    GET(req, res)
  } else if (req.method === 'PUT') {
    PUT(req, res)
  } else if (req.method === 'DELETE') {
    DELETE(req, res)
  }

}

function POST(req: NextApiRequest, res: NextApiResponse) {
}

function GET(req: NextApiRequest, res: NextApiResponse) {
}


function PUT(req: NextApiRequest, res: NextApiResponse) {
}

function DELETE(req: NextApiRequest, res: NextApiResponse) {
}


