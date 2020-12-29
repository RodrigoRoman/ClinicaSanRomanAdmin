const userListData = [];
console.log("connected--------");

// DOM Ready =============================================================
$(document).ready(function() {
  //set dates with default values
  $("#endDate").val(makeYMD(new Date(JSON.parse(endD))));
  $("#beginDate").val(makeYMD(new Date(JSON.parse(beginD))));
});

//FUNCTION CALLS 

// plus minus buttons from input
$("tbody" ).on( "click", ".minus", function() {
    const currentValue = parseInt($(this).parent().children(".quantity").val());
    if(currentValue-1>=0){
        $(this).parent().children(".quantity").val(currentValue-1);
    }
  });

$("tbody" ).on( "click", ".plus", function() {
    const currentValue = parseInt($(this).parent().children(".quantity").val());
    if(currentValue+1<999){
        $(this).parent().children(".quantity").val(currentValue+1);
    }
  });

//located below the search bar
$('#search_val').keyup(populateTable);

// pop modal with search
$('#search').click(populateTableModal);
$('#search_val').on('keypress', function (e) {
  if(e.which === 13){
      e.preventDefault();
      $('#search')[0].click();
  }
});

//remove search table when modal is closed
$('.close').click(function(){$('#searchList table tbody').html("")});
//Return the modal table to an empty state
$('.close').click(function(){$('#searchTableModal tbody').html("")});


// Hide search list body when clicked outside it
$("body").on('click',function(e){
  if($(e.target).closest("#searchList tbody").length === 0 && $(e.target).parent().attr('class') != "closeAlert" ) { $('#searchList table tbody').html("")};
});
//add service to car
$("tbody").on('click',".addToCart",addService); 

//delete Item from patient account
$("#account-table").on('click',".delete-item",removeService);

//edit item from patients account
$("#account-table").on('click',".edit-item",editService);

//edit item from patients account
$("#account-table").on('click',".accept-item",submitEditService);


//======= date range     =====
let patient  = JSON.parse(pat);
const patientDate = new Date(patient.admissionDate);
function makeYMD(date){
  const newDate = {d:date.getUTCDate(), m : date.getUTCMonth()+1,// JavaScript months are 0-11
y : date.getUTCFullYear()};
  return  newDate.y+ "-" + newDate.m+ "-" + ((newDate.d.toString().length>1)?newDate.d:"0"+newDate.d);
}


//set date buttons
$('.todays').click(function(){
  $("#endDate").val(makeYMD(new Date));
  $("#beginDate").val(makeYMD(new Date));
})
$('.tillToday').click(function(){
  $("#endDate").val(makeYMD(new Date));
  $("#beginDate").val(makeYMD(new Date(patientDate)));
})
$('.otherDate').click(function(){
  $("#endDate").val("");
  $("#beginDate").val("");
})
// $(".tillToday").click();

//Button 
$(".apply_dates").on("click",updateDate);

// Functions =============================================================
function makeDMY(date){
  const newDate = {d:date.getUTCDate(), m : date.getUTCMonth()+1,// JavaScript months are 0-11
  y : date.getUTCFullYear()};
  return  ((newDate.d.toString().length>1)?newDate.d:"0"+newDate.d)+ "/" + newDate.m+ "/" + newDate.y;
}
// Fill table with data
function populateTable(event) {
   event.preventDefault();
  // Empty content string
  let tableContent = '';
  // jQuery AJAX call for JSON
  let search = $("#search_val").val();
  $.getJSON( `/patients/${patient_id}/search3`,{search}, function(data) {
    // For each item in our JSON, add a table row and cells to the content string
    $.each(data, function(){
      tableContent += '<tr>';
      if(this.doctor){
        tableContent += '<td><a class = "text-dark" href="/services/'+this._id+'/edit">' + this.name + '</a></td>';
        tableContent += '<td><small alt ="'+this._id+'" class="text-muted">' + this.doctor + '</small></td>';
        tableContent += '<td><small class="text-muted">  </small></td>';
      }else{
        tableContent += '<td><a class = "text-dark" href="/services/supply/'+this.name+'">' + this.name + '</a></td>';
        tableContent += '<td><small alt ="'+this._id+'" class="text-muted">' + this.class + '</small></td>';
        tableContent += '<td><small alt ='+this._id+' class="text-muted"> Cad: ' + makeDMY(new Date(this.expiration))+ '</small></td>';

        }
      tableContent += '<td><div class="number-input"><button class="minus" ></button><input class="quantity" min="0" name="quantity" value="1" type="number"><button class="plus"></button></div></td>';
      tableContent += '<td class="art"><button type="button" class="addToCart btn btn-sm btn-info">Agregar</button></td>';
      tableContent += '</tr>';
    });

    // Inject the whole content string into our existing HTML table
    $('#searchList table tbody').html(tableContent);
  });
};



//for a popup window
function populateTableModal(event) {
    event.preventDefault();
  // Empty content string
  let tableContent = '';
  // jQuery AJAX call for JSON
  let search = $("#search_val").val();
  $.getJSON( `/patients/${patient_id}/search`,{search}, function( data ) {
    // For each item in our JSON, add a table row and cells to the content string
    $.each(data, function(){
      tableContent += '<tr>';
      if(this.doctor){
        tableContent += '<td><a class = "text-dark" href="/services/'+this._id+'/edit">' + this.name + '</a></td>';
        tableContent += '<td><small alt ='+this._id+' class="text-muted">' + this.doctor + '</small></td>';
        tableContent += '<td><small class="text-muted">  </small></td>';

      }else{
        tableContent += '<td><a class = "text-dark" href="/services/supply/'+this.name+'">' + this.name + '</a></td>';
        tableContent += '<td><small alt ='+this._id+' class="text-muted">' + this.class + '</small></td>';
        tableContent += '<td><small class="text-muted"> Cad: ' + makeDMY(new Date(this.expiration)) + '</small></td>';
      };
      tableContent += '<td><div class="number-input"><button class="minus"></button><input class="quantity" min="0" name="quantity" value="1" type="number"><button class="plus"></button></div></td>';
      tableContent += '<td><button type="button" class="addToCart btn btn-sm btn-info">Agregar</button></td>';
      tableContent += '</tr>';
    });
    // Inject the whole content string into our existing HTML table
    $('.modal-body #searchTableModal tbody').html(tableContent);
  });
};

function addService(event) {
    event.preventDefault();
    // If it is, compile all user info into one object
    const service_amount = {
        'service':$(this).parent().parent().find("small").attr("alt"),
        'addAmount': parseInt($(this).parent().parent().find(".quantity").val()),
    }
    const self = this;
    // Use AJAX to post the object to our adduser service
    $.ajax({
    method: 'POST',
    data: service_amount,
    url: `/patients/${patient_id}/accountCart`,
    dataType: 'JSON',
    }).done(function( response ) {
    // Check for successful (blank) response
    const uniqueStr = Math.random().toString(36).substring(7);
    if (response.msg === 'True') {
        // Clear the form inputs
        let flashMessage = `<div class="alert alert-success alert-dismissible fade show fixed-top" role="alert">
        ${response.serviceName} agregado a cuenta de ${response.patientName}
        <button type="button" id = flashMessage${uniqueStr} class="closeAlert" data-dismiss="alert" aria-label="Close">
            <span aria-hidden="true">&times;</span>
        </button>
        </div> `;
        if ( $( "#searchTableModal tr" ).length ) {
            $(".modal").prepend(flashMessage);
            $("#account-table"). load(" #account-table > *")
            
        }else{
            $("main").prepend(flashMessage);
            $("#account-table"). load(" #account-table > *")
        }
        setInterval(function(){$(`#flashMessage${uniqueStr}`).click()},3000);

    }
    else {
        // If something goes wrong, alert the error message that our service returned
        let flashMessage = `<div class="alert alert-danger alert-dismissible fade show fixed-top" role="alert">
        Error: No hay suficientes unidades de ${response.serviceName} en almacen
        <button type="button" id = "flashMessage${uniqueStr}" class="closeAlert" data-dismiss="alert" aria-label="Close">
            <span aria-hidden="true">&times;</span>
        </button>
        </div> `;
        if ( $( "#searchTableModal tr" ).length ) {
            $(".modal").prepend(flashMessage);
        }else{
            $("main").prepend(flashMessage);
        }
        setInterval(function(){$(`#flashMessage${uniqueStr}`).click()},3000);
    }
  });
};

//delete Item from patient account
function removeService(event) {
    event.preventDefault();
    let confirmation = confirm('Borrar el servicio de la cuenta del paciente?');
  // Check and make sure the user confirmed
    if (confirmation === true) {
        // If they did, do our delete
        $.ajax({
        type: 'DELETE',
        url: `/patients/${patient_id}/accountCart`,
        data: {
            'serviceID': $(this).parent().parent().parent().find(".item-name").attr("alt"),
            'amount': parseInt($(this).parent().parent().parent().find(".item-amount").text()),
            'begin':makeYMD(new Date(JSON.parse(beginD))),
            'end':makeYMD(new Date(JSON.parse(endD))) 
          }
        }).done(function(response) {
            //refresh table
            $("#account-table"). load(" #account-table > *")
        });

    }
    else {
        // If they said no to the confirm, do nothing
        return false;
    }
};


//edit item from patients account
function editService(event) {
  event.preventDefault();
  let preVal = $(this).parent().parent().parent().find(".item-amount").text();
  $(this).parent().parent().parent().find(".item-amount").replaceWith( `<input type = "number" value = "${preVal}" class = "amountEdit">` );
  $(this).parent().parent().parent().find(".buttons").replaceWith( `<span class = "float-right buttons">
          <button type="button"  class="accept-item btn btn-sm mr-4 btn-outline-primary">Aceptar</button></span>` );
};


//submit edit form with new vlaues after clicking accept
function submitEditService(event) {
  event.preventDefault();
      // send update request
      $.ajax({
        type: 'PUT',
        url: `/patients/${patient_id}/accountCart`,
        data: {
          'serviceID': $(this).parent().parent().parent().find(".item-name").attr("alt"),
          'amount': parseInt($(this).parent().parent().parent().find(".amountEdit").val())
        },
        dataType: 'JSON',
      }).done(function(response){
        const uniqueStr = Math.random().toString(36).substring(7);
        if (response.msg === 'True') {
          let flashMessage = `<div class="alert alert-success alert-dismissible fade show fixed-top" role="alert">
          ${response.serviceName} editado en cuenta de ${response.patientName}
          <button type="button" id = flashMessage${uniqueStr} class="closeAlert" data-dismiss="alert" aria-label="Close">
              <span aria-hidden="true">&times;</span>
          </button>
          </div> `;
          $("main").prepend(flashMessage);
          $("#account-table"). load(" #account-table > *")
          setInterval(function(){$(`#flashMessage${uniqueStr}`).click()},3000);
      }
      else {
          // If something goes wrong, alert the error message that our service returned
          let flashMessage = `<div class="alert alert-danger alert-dismissible fade show fixed-top" role="alert">
          Error: No hay suficientes unidades de ${response.serviceName} en almacen
          <button type="button" id = "flashMessage${uniqueStr}" class="closeAlert" data-dismiss="alert" aria-label="Close">
              <span aria-hidden="true">&times;</span>
          </button>
          </div> `;
          $("main").prepend(flashMessage);
          $("#account-table"). load(" #account-table > *");
          setInterval(function(){$(`#flashMessage${uniqueStr}`).click()},3000);
      }

      });
};

//refresh page with new query values
function updateDate(){
  window.location.href = window.location.pathname+"?"+$.param({
    'begin': $("#beginDate").val(),
    'end': $("#endDate").val()
  })
}

