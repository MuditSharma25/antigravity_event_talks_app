const https = require('https');

const url = 'https://news.google.com/rss';

console.log('Fetching latest news from Google...');

https.get(url, (res) => {
  let data = '';

  // A chunk of data has been received.
  res.on('data', (chunk) => {
    data += chunk;
  });

  // The whole response has been received. Print out the result.
  res.on('end', () => {
    // Regex to extract the title and link from the <item> tags
    const itemRegex = /<item>[\s\S]*?<title>(.*?)<\/title>[\s\S]*?<link>(.*?)<\/link>[\s\S]*?<\/item>/g;
    let match;
    let count = 0;
    
    console.log('\n--- Top 5 Latest News from Google ---\n');
    
    while ((match = itemRegex.exec(data)) !== null && count < 5) {
      // Decode simple HTML entities
      const title = match[1]
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
      
      const link = match[2];
      
      console.log(`${count + 1}. ${title}`);
      console.log(`   ${link}\n`);
      count++;
    }
    
    if (count === 0) {
      console.log('No news found or unable to parse the RSS feed.');
    }
  });

}).on('error', (err) => {
  console.error('Error fetching news:', err.message);
});
