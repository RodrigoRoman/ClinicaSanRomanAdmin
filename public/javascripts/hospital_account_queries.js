
$(document).ready(function() {

});
// populate body with found elements
$('#search_val').keyup(foundServicePayment);

$('.custom-select').change(foundServicePayment);

$('#beginDay').click(foundServicePayment)
$('#beginDay').click(foundServicePayment)
// $('.pdfReport').click(pdfReportReq)
$('#endDay').click(foundServicePayment)
$(".apply_dates").on("click",foundServicePayment);

//check boxs
$('#income').on('change',function(e){
    if($("#income").val()==''){$("#income").val("entry");$("#income").prop('checked', true)}else{$("#income").val("");$("#income").prop('checked', false)};
    foundServicePayment(e);
  });
  $('#outcome').on('change',function(e){
    if($("#outcome").val()==''){$("#outcome").val("exit");$("#outcome").prop('checked', true)}else{$("#outcome").val("");$("#outcome").prop('checked', false)};
    foundServicePayment(e);
  });
  $('#hospital').on('change',function(e){
    if($("#hospital").val()==''){$("#hospital").val("hospital");$("#hospital").prop('checked', true)}else{$("#hospital").val("");$("#hospital").prop('checked', false)};
    foundServicePayment(e);
  });
  $('#honorary').on('change',function(e){
    if($("#honorary").val()==''){$("#honorary").val("honorary");$("#honorary").prop('checked', true)}else{$("#honorary").val("");$("#honorary").prop('checked', false)};
    foundServicePayment(e);
  });







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
  
function makeDMY(date){
  const newDate = {d:date.getUTCDate(), m : date.getUTCMonth()+1,// JavaScript months are 0-11
  y : date.getUTCFullYear()};
  return  ((newDate.d.toString().length>1)?newDate.d:"0"+newDate.d)+ "/" + newDate.m+ "/" + newDate.y;
}
// function pdfReportReq(event){
//     // event.preventDefault();
//     dat = {begin:$('#beginDate').val(),end:$('#endDate').val()}
//     $.ajax({
//         type: 'POST',
//         url: '/exits/hospital_account',
//         data: dat,
//         })
// }
// Fill table with data
function foundServicePayment(event) {
    event.preventDefault();
    const dat = {'sorted':$(".custom-select").val(),'begin':$("#beginDate").val(),'end':$("#endDate").val(),
    'entry':$("#income").val(),'exit':$("#outcome").val(),'hospital':$("#hospital").val(),'honorary':$("#honorary").val()};
    let accountContent = '';
   $.ajax({
    type: 'GET',
    url: '/exits/searchSP',
    data: dat,
    dataType: 'JSON',
    processData: true,
    cache: false
    }).done(function( response ){
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        let total_income = 0;
        let total_outcome = 0;
        let total_exit = 0;
        accountContent+=`<div class="container account">`;
        if((response.sorted == "name") || (response.sorted == "Ordenar por:")){
            if(Object.keys(response.transactions ).length != 0){
            accountContent+=`<h1 class = "ml-2">Ingresos</h1>
            <table class="table table-borderless sticky1">
             <thead class="thead-dark ">
                <tr>  
                    <th scope="col"><h6 class="pad">Servicio</h6></th>
                    <th scope="col"><h6 class="pad">Clase</h6></th> 
                    <th scope="col"><h6 class="pad">Cantidad</h6></th>`
                    if(response.currentUser.role == "directAdmin"){     
                        accountContent+=`<th scope="col"><h6 class="pad">Compra</h6></th>
                        <th scope="col"><h6 class="pad">Venta</h6></th>
                        <th scope="col"><h6 class="pad">Egreso</h6></th> 
                        <th scope="col"><h6 class="pad">Ingreso</h6></th>   
                        <th scope="col"><h6 class="pad">Ganancia</h6></th>`  
                    }    
                    accountContent+=`</tr>  
            </thead>`;
            accountContent+=`<tbody>`;
            (response.transactions).forEach(function(item){
                let price = 0;
                if(item.service_type == "supply"){price = item.sell_price;buy = item.buy_price}else{price = item.price;buy = 0}
                let entry_subtotal = +(price * item.amount).toFixed(3);let spent_subtotal = +(buy * item.amount).toFixed(3); let item_subtotal = +(entry_subtotal-spent_subtotal).toFixed(3);
                accountContent+=`
                <tr>  
                    <td>${item.name}</td>
                    <td>${item.class}</td> 
                    <td>${item.amount}</td>` 
                    if(response.currentUser.role == "directAdmin"){     
                        if(item.service_type == "supply"){
                            accountContent+=`<td>$${buy}</td>`; 
                        }else{
                            accountContent+=`<td></td>`;
                        }
                        accountContent+=`<td>$${price}</td>`;
                        if(item.service_type == "supply"){
                            accountContent+=`<td>$${spent_subtotal}</td>`; 
                        }else{
                            accountContent+=`<td></td>`;
                        }
                            accountContent+=`<td>$${entry_subtotal}</td>
                        <td>$${item_subtotal}</td> `
                    } 
                accountContent+=`</tr> `;
                total_income += entry_subtotal;
                total_outcome += spent_subtotal;
            })
            total_income = +(total_income).toFixed(3);
            total_outcome = +(total_outcome).toFixed(3);
            accountContent+=`</tbody>
            </table> </div>`
            if(response.currentUser.role == "directAdmin"){     
                accountContent+=`<div class = "container">
                    <h2 class = "float-right border border-secondary rounded"><span class = "mx-2 my-2">Total Ingresos: $${total_income.toFixed(3)}</span></h2>
                </div>`
            }    
            accountContent+=`<br><br>`
        };
            }
            if(response.sorted == "class"){
                accountContent+=`<h1 class = "ml-2">Ingresos</h1>
                <table class="table table-borderless sticky1">
                 <thead class="thead-dark ">
                    <tr>  
                        <th scope="col"><h6 class="pad">Clase</h6></th>
                        <th scope="col"><h6 class="pad">Cantidad</h6></th>`  
                        if(response.currentUser.role == "directAdmin"){     
                        accountContent+=`<th scope="col"><h6 class="pad">Egreso</h6></th> 
                        <th scope="col"><h6 class="pad">Ingreso</h6></th>   
                        <th scope="col"><h6 class="pad">Ganancia</h6></th> `
                        }
                    accountContent+=`</tr>  
                </thead><tbody>`;
                (response.transactions).forEach(function(item,index){
                    let entry_subtotal = +(item.totalSell).toFixed(3), spent_subtotal = +(item.totalBuy).toFixed(3),item_subtotal = +(entry_subtotal-spent_subtotal).toFixed(3);
                    accountContent+=`
                    <tr>  
                        <td>${item.class}</td> 
                        <td>${item.amount}</td>`
                        if(response.currentUser.role == "directAdmin"){     
                            accountContent+=`<td>$${spent_subtotal}</td> 
                            <td>$${entry_subtotal}</td>  
                            <td>$${item_subtotal}</td> `
                        } 
                    accountContent+=`</tr> `
                    total_income += entry_subtotal;
                    total_outcome += spent_subtotal;
                })
                total_income = +(total_income).toFixed(3);
                total_outcome = +(total_outcome).toFixed(3);
                accountContent+=`</tbody>
                </table> </div>`
                if(response.currentUser.role == "directAdmin"){     
                    accountContent+=`<div class = "container">
                    <h2 class = "float-right border border-secondary rounded"><span class = "mx-2 my-2">Total Ingresos: $${total_income.toFixed(3)}</span></h2>
                    </div>`
                }
            accountContent+=`<br>  <br>`
                }
                if(response.sorted == "patient"){
                    accountContent+=`<h1 class = "ml-2">Ingresos</h1>
                    <table class="table table-borderless sticky1">
                     <thead class="thead-dark ">
                        <tr>  
                            <th scope="col"><h6 class="pad">Patient</h6></th>
                            <th scope="col"><h6 class="pad">Fecha</h6></th>  
                            <th scope="col"><h6 class="pad">Egreso</h6></th> 
                            <th scope="col"><h6 class="pad">Ingreso</h6></th>   
                            <th scope="col"><h6 class="pad">Ganancia</h6></th> 
                        </tr>  
                    </thead>`
                    accountContent+=`<tbody>`;
                    (response.transactions).forEach(function(item,index){
                        let entry_subtotal = +(item.totalSell).toFixed(3), spent_subtotal = +(item.totalBuy).toFixed(3),item_subtotal = +(entry_subtotal-spent_subtotal).toFixed(3);
                        accountContent+=`  
                        <tr>
                            <td><a href = "/patients/${item.patientId}/dischargedPDF">${item.name}</a></td> 
                            <td>${makeDMY(new Date(item.admissionDate))}</td>
                            <td>$${spent_subtotal}</td> 
                            <td>$${entry_subtotal}</td>  
                            <td>$${item_subtotal}</td>  
                        </tr> `
                        total_income += entry_subtotal;
                        total_outcome += spent_subtotal;
                    })
                    +(total_income).toFixed(3);
                    +(total_outcome).toFixed(3);
                    accountContent+=`</tbody>
                    </table> </div>
                    <div class = "container">
                    <h2 class = "float-right border border-secondary rounded"><span class = "mx-2 my-2">Total Ingresos: $${total_income.toFixed(3)}</span></h2>
                </div>      <br>  <br>`
                    }
                if(response.exit =="exit"){
                    accountContent+=`<h1 class = "text-danger">Egresos</h1>
                    <table class="table table-borderless sticky1">
                        <thead class="table-danger">
                            <tr>  
                                <th scope ="col"><h6 class="pad">Nombre</h6></th>
                                <th scope="col"><h6 class="pad">Liquidacion</h6></th> 
                                <th scope="col"><h6 class="pad">Pagos</h6></th>  
                                <th scope="col"><h6 class="pad">Costo</h6></th>  
                                <th scope="col"><h6 class="pad">Subtotal</h6></th> 
                            </tr>  
                        </thead>
                        <tbody >`;
                    
                    (response.exits).forEach(function(item){
                            accountContent+=`<tr class = "">  
                                <td>${item.name}</td>
                                <td>${makeDMY(new Date(item.dueDate))}</td>
                                <td>${item.totalAmount}</td> 
                                <td>$${item.price}</td>  
                                <td>$${item.totalCost}</td>  
                            </tr> `;

                            total_outcome += item.totalCost;
                            total_exit += item.totalCost;
                    })
                    total_income = +(total_income).toFixed(3);
                    total_outcome = +(total_outcome).toFixed(3);
                    accountContent+=` </tbody> 
                    </table>`;
                }
                if(response.exit == "exit"){
                accountContent+=`<h2 class = "float-right border border-secondary rounded my-4"><span class = "mx-2 my-2">Total Egresos: $${total_exit}</span></h2>
                `}
                if(response.currentUser.role == "directAdmin"){     

                    accountContent+=`<br>  <br>
                        
                        <table class="table table-borderless">
                        
                            <thead class="table-dark">
                                    <tr>  
                                        <th scope="col"><h2 class="pad"><span class = "text-danger">Salida:</span> $${total_outcome}</h2></th> 
                                        <th scope="col"><h2 class="pad">Entrada: $${total_income.toFixed(3)}</h2></th> 
                                        <th scope ="col"><h2 class="pad">Ganancia: $${+(total_income-total_outcome).toFixed(3)}</h2></th>
                                    </tr>  
                            </thead>
                        </table>`;
                }
                // Inject the whole content string into our existing HTML table
                $('.account').html( accountContent);
                //{entry,exit,hospital,honorary,sorted,begin,end} 
                $('#beginDate').val(response.begin);
                $('#endDate').val(response.end);
                if(response.entry!=''){$("#income").val("entry");$("#income").prop('checked', true)}else{$("#income").val("");$("#income").prop('checked', false)};
                if(response.exit!=''){$("#outcome").val("exit");$("#outcome").prop('checked', true)}else{$("#outcome").val("");$("#outcome").prop('checked', false)};
                if(response.hospital!=''){$("#hospital").val("hospital");$("#hospital").prop('checked', true)}else{$("#hospital").val("");$("#hospital").prop('checked', false)};
                if(response.honorary!=''){$("#honorary").val("honorary");$("#honorary").prop('checked', true)}else{$("#honorary").val("");$("#honorary").prop('checked', false)};
   });
 };



  