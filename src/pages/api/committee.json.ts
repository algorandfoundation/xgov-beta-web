import committee from './committees/8Uca5NPkckwiZNHk9m2n8IAdDjd0z8tbXwgUyzVyxtc.json'
export function GET() {
  return new Response(
    JSON.stringify(committee),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
}
