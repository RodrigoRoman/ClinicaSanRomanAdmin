
$(document).ready(function() {

});
  
function debounce(func, timeout = 300){
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => { func.apply(this, args); }, timeout);
    };
  }
// populate body with found elements
// $('#search_val').keyup(debounce(foundServices));

$('#search_val').on('keyup', function(event) {
    // Check if the enter key was pressed (keyCode 13)
    if (event.keyCode === 13) {
       
            foundServices(event);
    
    }
  });

  // Add a click event listener to the search button
  $('#search-button').on('click', function(event) {
            foundServices(event);
  });

// $('.custom-select').change(foundServices);

$("body").delegate(".individual", "click",function(event) {
    $("#search_val").val($(this).val())
    $(".custom-select").val("name")
    foundServices(event)
  })
//   $( "#individual" ).click(function(event) {
//     event.preventDefault()
//     alert( "Handler for .click() called." );
//   })

$('.custom-select').change(function(event){
    const id = $(this).find("option:selected").attr("id");
    foundServices(event);
  });


//   $( "#individual" ).click(function(event) {
//     event.preventDefault()
//     alert( "Handler for .click() called." );
//   })


//======== Functions=====

//function for truncating string to n characters
function truncate(str, n){
    return (str.length > n) ? str.substr(0, n-1) + '...' : str;
  };

  function myFunction(){
    alert("The button was pressed");
};   


 function foundServices(event) {
    let currentRequest = null;
    // event.preventDefault();
    const dat = {'search':$("#search_val").val(),'sorted':$(".custom-select").val(),'page':$(event).attr("alt")};
    let servicesContent = '';
   $.ajax({
    type: 'GET',
    url: '/services/searchServices',
    data: dat,
    dataType: 'JSON',
    processData: true,
    beforeSend : function()    {          
        if(currentRequest != null) {
            currentRequest.abort();
        }
    },
    cache: false
    }).done(function( response ){
        servicesContent+=`<div class="row services scrollDiv">`
        $.each(response.services, function(){
            // alert(response.page);
            //create a unique id. Add "a" as prefix so that avery string is acceptable
            let id_name = "a"+Math.random().toString(36).substring(7);
            servicesContent+=(`
                <div class="col-3">
                    <div class="card mb-3">
                        <div id="`+id_name+`" class="carousel slide" data-ride="carousel">
                            <div class="carousel-inner">`);
                 this.images.forEach((img, i) => {
                if(i==0){
                    servicesContent+=(`<div class="carousel-item active">
                     <img class="card_img mt-4" src="`+img.url+`"  alt="">
                 </div>`
                 )
                }else{
                    servicesContent+=(`<div class="carousel-item">
                        <img class="card_img mt-4" src="`+img.url+`"  alt="">
                    </div>`
                    )
                }
                 });
                 servicesContent+=`</div>`;
                  if(this.images.length > 1) {
                      servicesContent+=(`
                    <a class="carousel-control-prev " href="#`+id_name+`" role="button" data-slide="prev">
                    <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                    <span class="sr-only">Previous</span>
                    </a>
                    <a class="carousel-control-next" href="#`+id_name+`" role="button" data-slide="next">
                        <span class="carousel-control-next-icon" aria-hidden="true"></span>
                        <span class="sr-only">Next</span>
                    </a>`);
                  }
                  servicesContent+=(`
                        </div>
                        <div class="card-body">
                            <div class = "d-inline"><h3 class="card-subtitle ">`+this.name+`</h3></div>
                            <h5 class="card-title text-muted">`+ this.class+`</h5>
                        </div>
                        <ul class="list-group list-group-flush">
                            <li class="list-group-item">Encargado: `+this.doctor+`</li>
                            <div class="clearfix split-items">
                                <li class="list-group-item left-side">Precio: $`+this.price+`</li>
                                <li class="list-group-item right-side">Unidad: `+this.unit+`</li>
                            </div>
                            <li class="list-group-item"><small>`+truncate(this.description,75)+`</small></li>
                        </ul>`);
                    if(true){
                servicesContent+= (`<div class="d-flex justify-content-around mx-1 my-1">
                            <a class="card-link btn btn-info" href="/services/`+this._id+`/edit?service_type=supply"><i class="fas fa-edit"></i></a>
                            <form class="d-inline" action="/services/`+this._id+`?_method=DELETE" method="POST">
                                <button class="btn btn-danger"><i class="fas fa-trash"></i></button>
                            </form>
                        </div>`);
                         }
                servicesContent+= (`</div>
                                        </div>`);
            
                 });
                 servicesContent+=`</div>`
                 let pagination = `<div class="row my-3 pagination customClass">
                 <div class="btn-group float-right" role="group" aria-label="First group">`;
                    if(response.page >1){
                        pagination += `<a onclick="foundServices(this)" alt="${response.page-1}" class="btn btn-light " role="button" aria-pressed="true"><i class="fas fa-arrow-circle-left"></i></a>`
                    }
                    for(let step = 1; step < response.pages+1; step++) {
                        let act = (step == response.page)?"active":"";
                        pagination += `<a onclick="foundServices(this)" alt="${step}" class="btn btn-light ${act}" role="button" aria-pressed="true">${step}</a>`
                    }
                    if(response.page+1 <= response.pages){
                        pagination += `<a onclick="foundServices(this)" alt="${response.page+1}" class="btn btn-light " role="button" aria-pressed="true"><i class="fas fa-arrow-circle-right"></i></a>`
                    }
                     pagination += `</div>
                     </div>`
                 $('.services').html( servicesContent);  
                 $('.pagination').replaceWith( pagination); 
                 $("selector").find('option[value="'+response.sorted+'"]').attr('selected','selected')
                 $("#search_val").val(response.search)
     
   });
 };
