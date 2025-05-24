const debounce = (fn, delay) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

let currentController = null;

async function getRecords(domain) {
  if (currentController) {
    currentController.abort();
  }

  if (!domain || !domain.includes(".")) {
    document.getElementById("result").innerHTML = "";
    document.getElementById("amount").innerHTML = "0 entries found";
    return;
  }

  currentController = new AbortController();
  const signal = currentController.signal;

  const types = [
    "A",
    "AAAA",
    "CNAME",
    "MX",
    "NS",
    "PTR",
    "SOA",
    "SRV",
    "TXT",
    "SPF",
    "CAA",
    "NAPTR",
    "TLSA",
  ];
  let output = "";
  let amount = 0;

  try {
    const promises = types.map(type =>
      fetch(`https://dns.google/resolve?name=${domain}&type=${type}`, { signal })
        .then(response => response.json())
        .then(data => {
          if (data.Answer) {
            amount += data.Answer.length;
            return data.Answer.map(record => 
              `<p class="record record-${type.toLowerCase()}">
                <span class="title">${type} (${record.name})</span>
                <span class="contents">${record.data}</span>
                <span class="ttl">TTL: ${record.TTL}</span>
              </p>`
            ).join('');
          }
          return '';
        })
        .catch(error => {
          if (error.name === 'AbortError') {
            return '';
          }
          console.error(`Error fetching ${type} records:`, error);
          return '';
        })
    );

    const results = await Promise.all(promises);
    output = results.join('');

    if (!signal.aborted) {
      document.getElementById("result").innerHTML = output;
      document.getElementById("amount").innerHTML = `${amount} entries found`;
    }
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error('Error:', error);
    }
  }
}

const debouncedGetRecords = debounce(getRecords, 200);

document.querySelector("#input").addEventListener("input", function () {
  debouncedGetRecords(this.value);
});

getRecords("example.com");
