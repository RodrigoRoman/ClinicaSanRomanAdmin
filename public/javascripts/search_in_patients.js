
$(document).ready(function() {

});
// populate body with found elements
$('#search_val').keyup(foundPatients);

$('.custom-select').change(foundPatients);

$('#beginDay').click(foundPatients)
$('#endDay').click(foundPatients)
$(".apply_dates").on("click",foundPatients);

//======== Functions=====

//function for truncating string to n characters
function truncate(str, n){
    return (str.length > n) ? str.substr(0, n-1) + '...' : str;
  };

function makeYMD(date){
const newDate = {d:date.getUTCDate(), m : date.getUTCMonth()+1,// JavaScript months are 0-11
y : date.getUTCFullYear()};
return  newDate.y+ "-" + ((newDate.m.toString().length>1)?newDate.m:"0"+newDate.m)+ "-" + ((newDate.d.toString().length>1)?newDate.d:"0"+newDate.d);
}
// Fill table with data
function foundPatients(event) {
    event.preventDefault();
    const dat = {'search':$("#search_val").val(),'sorted':$(".custom-select").val(),'begin':$("#beginDate").val(),'end':$("#endDate").val()};
    let patientsContent = '';
   $.ajax({
    type: 'GET',
    url: '/patients/searchPatients',
    data: dat,
    dataType: 'JSON',
    processData: true,
    cache: false
    }).done(function( response ){
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        patientsContent+=`<div class="patients row mt-4">`
        $.each(response.patients, function(){
            patientsContent+= '<div class="col-md-6">'
            let borderColor = (this.discharged)?"secondary":"primary";
            patientsContent+=`
            <div class="card index_card_p mb-4 border border-`+borderColor+`">
                <div class="row">
                    <div class="container">
                        <div class="col-md-16">
                            <div class="card-body">
                                <h3 class="card-title">`+this.name+` </h3>
                                <h4 class="card-title text-muted">Fecha de ingreso:`+ new Date(this.admissionDate).toLocaleDateString('es-ES', options)+`</h4>`
                                if(this.discharged){
                                    patientsContent+=`<h4 class="card-title text-muted">Fecha de egreso:`+ new Date(this.dischargedDate).toLocaleDateString('es-ES', options)+`</h4>`
                                }
                                patientsContent+=`<ul class="list-group list-group-flush mb-4">
                                    <li class="list-group-item">Email: `+this.email+`</li>
                                    <li class="list-group-item">Telefono: `+this.phone+`</li>
                                    <li class="list-group-item">RFC: `+this.rfc+`</li>
                                    <li class="list-group-item">Dirección: `+this.address+`</li>
                                    <li class="list-group-item">Agregado por:  `+this.author.username+`</li>
                                    <li class="list-group-item">Medico tratante:  `+this.treatingDoctor+`</li>
                                    <li class="list-group-item text-muted">Diagnostico: `+this.diagnosis+`</li>
                                </ul>`
                                if(!this.discharged){
                                    patientsContent+=`<a class="btn btn-primary" href="/patients/`+this._id+`">Ver cuenta</a>
                                    <form class="d-inline" action="/patients/`+this._id+`?_method=DELETE" method="POST">
                                        <button class="float-right btn btn-outline-danger mx-1 my-1 btn-sm"><i class="fas fa-trash"></i></button>
                                    </form>
                                    <a class="float-right btn btn-outline-secondary mx-1 my-1 btn-sm" href="/patients/`+this._id+`/edit"><i class="fas fa-edit"></i></a>`
                                }else{
                                    
                                    const b = new Date(this.admissionDate).toISOString().substr(0,10);
                                    const e = new Date(this.dischargedDate).toISOString().substr(0,10);
                    
                                    patientsContent+=` <a href = "/patients/`+this._id+`/dischargedPDF">
                                        <button type="button" class="btn btn-outline-secondary">Ver cuenta</button>
                                    </a>`
                                }
                                patientsContent+=`
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`
            
                 });
                 patientsContent+=`</div>`
                // Inject the whole content string into our existing HTML table
                 $('.patients').html( patientsContent);
                 $('#beginDate').val(makeYMD(response.begin));
                 $('#endDate').val(makeYMD(response.end));
   });
 };



  