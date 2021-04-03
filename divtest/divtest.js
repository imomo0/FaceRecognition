
let arr = ["hvem", "outdoor_temp"];
let respons = "";

httpGET("http://localhost:1880/global", arr, test);

function log(text)
{
    console.log(text)
}


function httpGET(url, params, func) {
    const Http = new XMLHttpRequest();
    let urlParam = "";
    
    if(params !== undefined && typeof params !== "string")
    {
        urlParam += url + "?";
        params.forEach(param => {
        urlParam += param +"&";
        })
    }
    else urlParam = url + "?" + params;
    Http.open("GET", urlParam);
    Http.send();
    Http.onreadystatechange = func

  }

function test()
{
    if(this.readyState === 4)
    {
        console.log(this.responseText) 
    }   
}

/*
function test2()
{
    Http.onreadystatechange = (e) => {
        if(Http.readyState === 4)
        {
            console.log(Http.responseText) 
        }   
    }
}
*/