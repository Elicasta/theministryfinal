// Server-only modules include answer keys. They are never browser assets.
export default function handler(req,res){res.setHeader('Cache-Control','no-store');return res.status(404).json({error:'Not found'})}
