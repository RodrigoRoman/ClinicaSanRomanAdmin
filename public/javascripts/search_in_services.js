
$(document).ready(function() {

});
  
// populate body with found elements
$('#search_val').keyup(foundServices);

$('.custom-select').change(foundServices);


//======== Functions=====

//function for truncating string to n characters
function truncate(str, n){
    return (str.length > n) ? str.substr(0, n-1) + '...' : str;
  };


// Fill table with data
function foundServices(event) {
    event.preventDefault();
    const dat = {'search':$("#search_val").val(),'sorted':$(".custom-select").val()};
    let servicesContent = '';
   $.ajax({
    type: 'GET',
    url: '/services/searchServices',
    data: dat,
    dataType: 'JSON',
    processData: true,
    cache: false
    }).done(function( response ){
        servicesContent+=`<div class="row services">`
        $.each(response, function(){
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
                // Inject the whole content string into our existing HTML table
                 $('.services').html( servicesContent);

     
   });
 };



  